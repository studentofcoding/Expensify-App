import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { View, PanResponder } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import _ from 'underscore';
import styles from '../../styles/styles';
import variables from '../../styles/variables';
import withWindowDimensions, { windowDimensionsPropTypes } from '../withWindowDimensions';
import FullscreenLoadingIndicator from '../FullscreenLoadingIndicator';
import Image from '../Image';

/**
 * Renders an ImageView component that displays an image with zoom and pan functionality.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} props.url - The URL of the image to be displayed.
 * @param {number} props.windowWidth - The width of the window.
 * @param {number} props.windowHeight - The height of the window.
 * @param {boolean} props.isAuthTokenRequired - Indicates if an authentication token is required to access the image.
 * @param {function} props.onPress - The function to be called when the image is clicked.
 * @param {function} props.onScaleChanged - The function to be called when the image scale is changed.
 * @param {object} style - The style object for the component.
 * @return {ReactElement} The rendered ImageView component.
 */
function ImageView(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const [interactionPromise] = useState(undefined);
    const [containerHeight, setContainerHeight] = useState(undefined);

    const doubleClickInterval = 175;
    const imageZoomScale = useRef(1);
    const lastClickTime = useRef(0);
    const amountOfTouches = useRef(0);
    const zoom = useRef(null);

    const updatePanResponderTouches = (e, gestureState) => {
        if (_.isNumber(gestureState.numberActiveTouches)) {
            amountOfTouches.current = gestureState.numberActiveTouches;
        }

        return false;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: updatePanResponderTouches,
    });

    const resetImageZoom = useCallback(() => {
        if (imageZoomScale.current !== 1) {
            imageZoomScale.current = 1;
        }
    
        if (zoom.current) {
            zoom.current.centerOn({
                x: 0,
                y: 0,
                scale: 1,
                duration: 0,
            });
        }
    }, []);

    const imageLoadingStart = useCallback(() => {
        if (isLoading) {
            return;
        }
        resetImageZoom();
        setImageHeight(0);
        setImageWidth(0);
        setIsLoading(true);
    }, [isLoading, resetImageZoom]);

    useEffect(() => {
        if (props.url) {
            imageLoadingStart();
        }

        return () => {
            if (!interactionPromise) {
                return;
            }
            interactionPromise.cancel();
        };
    }, [props.url, imageLoadingStart, interactionPromise]);

    /**
     * Configures the image zoom based on the provided native event.
     *
     * @param {object} nativeEvent - The native event object containing the width and height of the image.
     */
    const configureImageZoom = ({ nativeEvent }) => {
        let imgWidth = nativeEvent.width;
        let imgHeight = nativeEvent.height;
        const containerWidth = Math.round(props.windowWidth);
        const ctnrHeight = Math.round(containerHeight || props.windowHeight);

        const aspectRatio = Math.min(ctnrHeight / imgHeight, containerWidth / imgWidth);

        imgHeight *= aspectRatio;
        imgWidth *= aspectRatio;

        const maxDimensionsScale = 11;
        imgWidth = Math.min(imageWidth, containerWidth * maxDimensionsScale);
        imgHeight = Math.min(imageHeight, containerHeight * maxDimensionsScale);
        setImageHeight(imgHeight);
        setImageWidth(imgWidth);
        setIsLoading(false);
    };

    const windowHeight = props.windowHeight - variables.contentHeaderHeight;
    const hasImageDimensions = imageWidth !== 0 && imageHeight !== 0;
    const shouldShowLoadingIndicator = isLoading || !hasImageDimensions;

    return (
        <View
            style={[styles.w100, styles.h100, styles.alignItemsCenter, styles.justifyContentCenter, styles.overflowHidden]}
            onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                setContainerHeight(layout.height);
            }}
        >
            {Boolean(containerHeight) && (
                <ImageZoom
                    ref={zoom}
                    onClick={() => props.onPress()}
                    cropWidth={props.windowWidth}
                    cropHeight={windowHeight}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    onStartShouldSetPanResponder={() => {
                        const isDoubleClick = new Date().getTime() - lastClickTime.current <= doubleClickInterval;
                        lastClickTime.current = new Date().getTime();

                        if (amountOfTouches.current === 2 || imageZoomScale.current !== 1) {
                            return true;
                        }

                        if (isDoubleClick) {
                            zoom.current.centerOn({
                                x: 0,
                                y: 0,
                                scale: 2,
                                duration: 100,
                            });

                            props.onScaleChanged(2);
                        }

                        return false;
                    }}
                    onMove={({ scale }) => {
                        props.onScaleChanged(scale);
                        imageZoomScale.current = scale;
                    }}
                >
                    <Image
                        style={[
                            styles.w100,
                            styles.h100,
                            props.style,
                            shouldShowLoadingIndicator ? styles.opacity0 : styles.opacity1,
                        ]}
                        source={{ uri: props.url }}
                        isAuthTokenRequired={props.isAuthTokenRequired}
                        resizeMode={Image.resizeMode.contain}
                        onLoadStart={imageLoadingStart}
                        onLoad={configureImageZoom}
                    />
                    <View
                        onStartShouldSetPanResponder={panResponder.panHandlers.onStartShouldSetPanResponder}
                        onMoveShouldSetPanResponder={panResponder.panHandlers.onMoveShouldSetPanResponder}
                        onStartShouldSetPanResponderCapture={panResponder.panHandlers.onStartShouldSetPanResponderCapture}
                        onMoveShouldSetPanResponderCapture={panResponder.panHandlers.onMoveShouldSetPanResponderCapture}
                        onPanResponderGrant={panResponder.panHandlers.onPanResponderGrant}
                        onPanResponderMove={panResponder.panHandlers.onPanResponderMove}
                        onPanResponderRelease={panResponder.panHandlers.onPanResponderRelease}
                        onPanResponderTerminate={panResponder.panHandlers.onPanResponderTerminate}
                        onPanResponderTerminationRequest={panResponder.panHandlers.onPanResponderTerminationRequest}
                        style={[styles.w100, styles.h100, styles.invisible]}
                    />
                </ImageZoom>
            )}
            {shouldShowLoadingIndicator && <FullscreenLoadingIndicator style={[styles.opacity1, styles.bgTransparent]} />}
        </View>
    );
};

ImageView.propTypes = {
    isAuthTokenRequired: PropTypes.bool,
    url: PropTypes.string.isRequired,
    onScaleChanged: PropTypes.func.isRequired,
    onPress: PropTypes.func,
    ...windowDimensionsPropTypes,
};

ImageView.defaultProps = {
    isAuthTokenRequired: false,
    onPress: () => {},
};

ImageView.displayName = 'ImageView';

export default withWindowDimensions(ImageView);
