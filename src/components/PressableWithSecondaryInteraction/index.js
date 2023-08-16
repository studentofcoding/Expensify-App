import _ from 'underscore';
import React, {useEffect, useRef,useCallback} from 'react';
import * as pressableWithSecondaryInteractionPropTypes from './pressableWithSecondaryInteractionPropTypes';
import styles from '../../styles/styles';
import * as DeviceCapabilities from '../../libs/DeviceCapabilities';
import * as StyleUtils from '../../styles/StyleUtils';
import PressableWithFeedback from '../Pressable/PressableWithFeedback';

/**
 * This is a special Pressable that calls onSecondaryInteraction when LongPressed, or right-clicked.
 */
const PressableWithSecondaryInteraction = React.forwardRef((props, forwardedRef) => {
    const pressableRef = useRef(null);

    const executeSecondaryInteraction = (e) => {
        if (DeviceCapabilities.hasHoverSupport() && !props.enableLongPressWithHover) {
            return;
        }
        if (props.withoutFocusOnSecondaryInteraction && pressableRef.current) {
            pressableRef.current.blur();
        }
        props.onSecondaryInteraction(e);
    }

    const executeSecondaryInteractionOnContextMenu = useCallback((e) => {
        if (!props.onSecondaryInteraction) {
            return;
        }

        e.stopPropagation();
        if (props.preventDefaultContextMenu) {
            e.preventDefault();
        }

        props.onSecondaryInteraction(e);
        if (props.withoutFocusOnSecondaryInteraction && pressableRef.current) {
            pressableRef.current.blur();
        }
    }, [props]);

    useEffect(() => {
        const currentPressableRef = pressableRef.current;
    
        if (forwardedRef) {
            if (_.isObject(forwardedRef)) {
                const newRef = {...forwardedRef};
                newRef.current = currentPressableRef;
            }
        }
        currentPressableRef.addEventListener('contextmenu', executeSecondaryInteractionOnContextMenu);
    
        return () => {
            currentPressableRef.removeEventListener('contextmenu', executeSecondaryInteractionOnContextMenu);
        }
    }, [executeSecondaryInteractionOnContextMenu, forwardedRef]);

    const inlineStyle = props.inline ? styles.dInline : {};

    return (
        <PressableWithFeedback
    accessibilityRole="button"
    wrapperStyle={StyleUtils.combineStyles(DeviceCapabilities.canUseTouchScreen() ? [styles.userSelectNone, styles.noSelect] : [], inlineStyle)}
    onPressIn={props.onPressIn}
    onLongPress={props.onSecondaryInteraction ? executeSecondaryInteraction : undefined}
    pressDimmingValue={props.activeOpacity}
    onPressOut={props.onPressOut}
    onPress={props.onPress}
    ref={pressableRef}
    style={(state) => [StyleUtils.parseStyleFromFunction(props.style, state), inlineStyle]}
>
    {props.children}
</PressableWithFeedback>
    );
});

PressableWithSecondaryInteraction.propTypes = pressableWithSecondaryInteractionPropTypes.propTypes;
PressableWithSecondaryInteraction.defaultProps = pressableWithSecondaryInteractionPropTypes.defaultProps;

export default PressableWithSecondaryInteraction;