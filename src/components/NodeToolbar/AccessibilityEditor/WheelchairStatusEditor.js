// @flow

import styled from 'styled-components';
import * as React from 'react';
import CustomRadio from './CustomRadio';
import StyledRadioGroup from './StyledRadioGroup';
import { t } from '../../../lib/i18n';
import { wheelmapFeatureCache } from '../../../lib/cache/WheelmapFeatureCache';
import { wheelmapLightweightFeatureCache } from '../../../lib/cache/WheelmapLightweightFeatureCache';
import { accessibilityDescription, shortAccessibilityName } from '../../../lib/Feature';
import type { WheelmapFeature, YesNoLimitedUnknown } from '../../../lib/Feature';

type Props = {
  featureId: number,
  feature: WheelmapFeature, // eslint-disable-line react/no-unused-prop-types
  className: string,
  onSave: ?((YesNoLimitedUnknown) => void),
  onClose: (() => void),
};


type State = {
  wheelchairAccessibility: YesNoLimitedUnknown,
};


class WheelchairStatusEditor extends React.Component<Props, State> {
  props: Props;

  state = {
    wheelchairAccessibility: 'unknown',
  };

  wheelchairAccessibility(props: Props = this.props): ?YesNoLimitedUnknown {
    if (!props.feature || !props.feature.properties || !props.feature.properties.wheelchair) {
      return null;
    }
    return props.feature.properties.wheelchair;
  }

  componentWillReceiveProps(props: Props) {
    const wheelchairAccessibility = this.wheelchairAccessibility(props);
    if (wheelchairAccessibility) {
      this.setState({ wheelchairAccessibility });
    }
  }

  save(value: YesNoLimitedUnknown) {
    // Don't override existing values. If somebody does not know the new toilet status, we trust
    // the last information we have.

    if (value === 'unknown') {
      if (typeof this.props.onClose === 'function') this.props.onClose();
    }

    const featureId = this.props.featureId;

    const formData = new FormData();
    formData.append('wheelchair', value);
    formData.append('_method', 'PUT');

    const options = {
      method: 'POST',
      body: formData,
    };

    wheelmapFeatureCache.updateFeatureAttribute(String(featureId), { wheelchair: value });
    wheelmapLightweightFeatureCache.updateFeatureAttribute(String(featureId), { wheelchair: value });

    fetch(`/nodes/${featureId}/update_wheelchair.js`, options);

    if (typeof this.props.onSave === 'function') this.props.onSave(value);
    if (typeof this.props.onClose === 'function') this.props.onClose();
  }


  render() {
    const wheelchairAccessibility = this.state.wheelchairAccessibility;

    const classList = [
      this.props.className,
      'basic-accessibility-editor',
    ].filter(Boolean);

    const valueHasChanged = wheelchairAccessibility !== this.wheelchairAccessibility();
    const valueIsDefined = wheelchairAccessibility !== 'unknown';
    const hasBeenUnknownBefore = this.wheelchairAccessibility() === 'unknown';

    // translator: Button caption shown while editing a place’s wheelchair status
    const confirmButtonCaption = t`Confirm`;

    // translator: Button caption shown while editing a place’s wheelchair status
    const changeButtonCaption = t`Change`;

    // translator: Button caption shown while editing a place’s wheelchair status
    const continueButtonCaption = t`Continue`;

    // translator: Button caption shown while editing a place’s wheelchair status
    const cancelButtonCaption = t`Cancel`;

    // translator: Button caption shown while editing a place’s wheelchair status
    const backButtonCaption = t`Back`;

    let saveButtonCaption = confirmButtonCaption;
    if (valueHasChanged) saveButtonCaption = changeButtonCaption;
    if (hasBeenUnknownBefore) saveButtonCaption = continueButtonCaption;

    const backOrCancelButtonCaption = valueHasChanged ? cancelButtonCaption : backButtonCaption;

    return (<section className={classList.join(' ')}>
      <header>How wheelchair accessible is this place?</header>

      <StyledRadioGroup
        name="accessibility"
        selectedValue={wheelchairAccessibility}
        onChange={(newValue) => { this.setState({ wheelchairAccessibility: newValue }); }}
        className={`${wheelchairAccessibility} ${valueIsDefined ? 'has-selection' : ''} radio-group`}
      >
        {['yes', 'limited', 'no'].map(value => (<CustomRadio
          key={value}
          shownValue={value}
          currentValue={wheelchairAccessibility}
          caption={shortAccessibilityName(value)}
          description={accessibilityDescription(value)}
        />))}
      </StyledRadioGroup>

      <footer>
        <button
          className={`link-button ${valueHasChanged ? 'negative-button' : ''}`}
          onClick={this.props.onClose}
        >
          {backOrCancelButtonCaption}
        </button>
        <button
          className="link-button primary-button"
          disabled={!valueIsDefined}
          onClick={() => {
            if (valueIsDefined) {
              this.save(wheelchairAccessibility);
              if (typeof this.props.onSave === 'function') {
                this.props.onSave(wheelchairAccessibility);
              }
            }
          }}
        >
          {saveButtonCaption}
        </button>
      </footer>
    </section>);
  }
}

const StyledWheelchairStatusEditor = styled(WheelchairStatusEditor)`
  display: flex;
  flex-direction: column;
  margin: 0.5em 0 0 0;

  > header, footer {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
  }
`;

export default StyledWheelchairStatusEditor;
