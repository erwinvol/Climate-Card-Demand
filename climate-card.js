/**
 * Home Assistant Custom Climate Card
 * Author: Antigravity AI
 * Card Type: custom:climate-card
 * Features:
 * - Centered Entity Friendly Name (no entity IDs displayed)
 * - Centered Humidity display below current temperature inside the dial
 * - Removed HVAC Mode header text label
 * - Mode-based active demand gauge and thermostat circular slider
 */

class ClimateCard extends HTMLElement {
  constructor() {
    super();
    this._config = {
      entity: 'climate.first_floor',
      heating_demand_entity: 'sensor.first_floor_outdoor_heat_pump_demand',
      cooling_demand_entity: 'sensor.first_floor_outdoor_cooling_demand'
    };
    this._hass = null;
    this._isDragging = false;
    
    // Default fallback state matched to live Home Assistant entities
    this._stateObj = {
      entity_id: 'climate.first_floor',
      state: 'heat',
      attributes: {
        friendly_name: 'First Floor Thermostat',
        hvac_modes: ['heat', 'cool', 'off'],
        hvac_action: 'idle',
        current_temperature: 21.6,
        current_humidity: 55,
        temperature: 16,
        min_temp: 7,
        max_temp: 35,
        target_temp_step: 0.5,
        unit_of_measurement: '°C'
      }
    };

    this._heatingDemandObj = {
      entity_id: 'sensor.first_floor_outdoor_heat_pump_demand',
      state: '0.0',
      attributes: {
        friendly_name: 'Daikin First Floor Outdoor Heat Pump Demand',
        unit_of_measurement: '%'
      }
    };

    this._coolingDemandObj = {
      entity_id: 'sensor.first_floor_outdoor_cooling_demand',
      state: '0.0',
      attributes: {
        friendly_name: 'Daikin First Floor Outdoor Cooling Demand',
        unit_of_measurement: '%'
      }
    };
  }

  setConfig(config) {
    if (!config.entity) {
      config = { entity: 'climate.first_floor', ...config };
    }
    if (!config.heating_demand_entity) {
      config = { heating_demand_entity: 'sensor.first_floor_outdoor_heat_pump_demand', ...config };
    }
    if (!config.cooling_demand_entity) {
      config = { cooling_demand_entity: 'sensor.first_floor_outdoor_cooling_demand', ...config };
    }
    this._config = config;
    this._renderCardSkeleton();
  }

  set hass(hass) {
    this._hass = hass;
    let needsUpdate = false;

    if (hass && this._config.entity && hass.states[this._config.entity]) {
      const stateObj = hass.states[this._config.entity];
      
      const unitFromConfig = hass.config && hass.config.unit_system ? hass.config.unit_system.temperature : null;
      const unitFromAttr = stateObj.attributes ? stateObj.attributes.unit_of_measurement : null;
      const detectedUnit = unitFromConfig || unitFromAttr || '°C';
      
      this._stateObj = {
        ...stateObj,
        attributes: {
          ...stateObj.attributes,
          unit_of_measurement: detectedUnit
        }
      };
      needsUpdate = true;
    }

    if (hass && this._config.heating_demand_entity && hass.states[this._config.heating_demand_entity]) {
      this._heatingDemandObj = hass.states[this._config.heating_demand_entity];
      needsUpdate = true;
    }

    if (hass && this._config.cooling_demand_entity && hass.states[this._config.cooling_demand_entity]) {
      this._coolingDemandObj = hass.states[this._config.cooling_demand_entity];
      needsUpdate = true;
    }

    if (needsUpdate && !this._isDragging) {
      this.updateUI();
    }
  }

  setSimulatedState(partialState, partialHeatingState, partialCoolingState) {
    if (partialState) {
      this._stateObj = {
        ...this._stateObj,
        ...partialState,
        attributes: {
          ...this._stateObj.attributes,
          ...(partialState.attributes || {})
        }
      };
    }
    if (partialHeatingState) {
      this._heatingDemandObj = {
        ...this._heatingDemandObj,
        ...partialHeatingState,
        attributes: {
          ...this._heatingDemandObj.attributes,
          ...(partialHeatingState.attributes || {})
        }
      };
    }
    if (partialCoolingState) {
      this._coolingDemandObj = {
        ...this._coolingDemandObj,
        ...partialCoolingState,
        attributes: {
          ...this._coolingDemandObj.attributes,
          ...(partialCoolingState.attributes || {})
        }
      };
    }
    if (!this._isDragging) {
      this.updateUI();
    }
  }

  connectedCallback() {
    if (!this.querySelector('.ha-climate-card')) {
      this._renderCardSkeleton();
    }
    this.updateUI();
  }

  _renderCardSkeleton() {
    let ticksHtml = '';
    const totalTicks = 28;
    for (let i = 0; i <= totalTicks; i++) {
      const pct = i / totalTicks;
      const angleDeg = 135 + pct * 270;
      const rad = (angleDeg * Math.PI) / 180;
      
      const x1 = 120 + 84 * Math.cos(rad);
      const y1 = 120 + 84 * Math.sin(rad);
      const x2 = 120 + 92 * Math.cos(rad);
      const y2 = 120 + 92 * Math.sin(rad);
      
      ticksHtml += `<line class="dial-tick" data-index="${i}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    }

    this.innerHTML = `
      <div class="ha-climate-card" id="cardContainer">
        <div class="card-content">
          
          <!-- Centered Header (No Entity IDs) -->
          <div class="card-header">
            <div class="entity-info">
              <div class="entity-name" id="friendlyName">First Floor Thermostat</div>
            </div>
            <!-- System Status Badge -->
            <div class="demand-badge" id="demandBadge">
              <span class="demand-dot"></span>
              <span id="demandText">IDLE</span>
            </div>
          </div>

          <!-- Thermostat Circular Dial -->
          <div class="dial-container" id="dialContainer">
            <svg class="dial-svg" viewBox="0 0 240 240">
              <!-- Radial Tick Marks -->
              <g class="dial-ticks-group" id="ticksGroup">
                ${ticksHtml}
              </g>

              <!-- Track (Starts at 135 deg, 270 deg arc) -->
              <circle class="dial-track" cx="120" cy="120" r="100" transform="rotate(135 120 120)" />
              <!-- Progress Arc -->
              <circle class="dial-progress" id="dialProgress" cx="120" cy="120" r="100" transform="rotate(135 120 120)" />
              
              <!-- Current Room Temp Indicator Pin -->
              <circle class="dial-current-pin" id="currentPin" cx="120" cy="120" r="4.5" />

              <!-- Setpoint Target Handle -->
              <circle class="dial-handle" id="dialHandle" cx="49.3" cy="190.7" r="14" />
            </svg>

            <!-- Center Info -->
            <div class="dial-center-info">
              <span class="current-temp-label" id="modeSublabel">TARGET TEMP</span>
              <div class="target-temp-display">
                <span class="target-temp-value" id="targetTempValue">16</span>
                <span class="target-temp-unit" id="tempUnit">°C</span>
              </div>
              <div class="room-temp-badge">
                Current: <strong id="currentTempValue">21.6°C</strong>
              </div>
              <!-- Centered Humidity Display Below Current Temp -->
              <div class="humidity-badge" id="humidityBadge">
                <svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                <span id="humidityValue">55% Humidity</span>
              </div>
            </div>
          </div>

          <!-- Fine Adjust Buttons (- / +) -->
          <div class="temp-adjust-row">
            <button class="btn-adjust" id="btnMinus" aria-label="Decrease Temperature">−</button>
            <button class="btn-adjust" id="btnPlus" aria-label="Increase Temperature">+</button>
          </div>

          <!-- Dynamic Mode-Based Outdoor Demand Gauge Meter -->
          <div class="heatpump-demand-container" id="heatpumpDemandSection">
            <div class="demand-meter-header">
              <span class="demand-meter-label" id="demandMeterLabel">Outdoor Heating Demand</span>
              <span class="demand-meter-val" id="heatpumpDemandVal">0%</span>
            </div>
            <div class="demand-meter-track">
              <div class="demand-meter-fill" id="heatpumpDemandFill" style="width: 0%;"></div>
            </div>
          </div>

          <!-- HVAC Mode Buttons Grid (Without 'HVAC Mode' header text label) -->
          <div class="controls-section">
            <div class="mode-grid" id="modeGrid">
              <button class="mode-btn" data-mode="heat" title="Heat (Flame)" aria-label="Heat Mode">
                <!-- Crisp MDI Fire Flame Icon -->
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.1c-.2 0-.4.1-.5.3-1.6 2.5-3.5 4.8-4.5 7.8-1 3 0 6.2 2.2 8.3 2.2 2.1 5.4 2.5 8.1 1 2.7-1.5 4.2-4.6 3.7-7.7-.5-3.1-2.6-5.7-4.5-8.2-.3-.4-.8-.7-1.3-.7-.2 0-.4.1-.5.3-1 1.7-2 3.4-2.7 5.2-.2.5-.9.6-1.2.2-.5-.6-.9-1.3-1.3-2-.3-.5-.7-1-1.1-1.5-.3-.4-.9-.5-1.4-.2z"/>
                </svg>
              </button>
              <button class="mode-btn" data-mode="cool" title="Cool (Snowflake)" aria-label="Cool Mode">
                <!-- Snowflake Icon -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <line x1="20" y1="12" x2="4" y2="12"></line>
                  <line x1="17.66" y1="4.34" x2="6.34" y2="17.66"></line>
                  <line x1="17.66" y1="17.66" x2="6.34" y2="4.34"></line>
                  <polyline points="10 4 12 2 14 4"></polyline>
                  <polyline points="10 20 12 22 14 20"></polyline>
                  <polyline points="4 10 2 12 4 14"></polyline>
                  <polyline points="20 10 22 12 20 14"></polyline>
                </svg>
              </button>
              <button class="mode-btn" data-mode="off" title="Turn Off" aria-label="Turn Off">
                <!-- Power Icon -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const card = this;
    
    // Plus / Minus Buttons
    this.querySelector('#btnPlus').addEventListener('click', () => card._adjustTemp(0.5));
    this.querySelector('#btnMinus').addEventListener('click', () => card._adjustTemp(-0.5));

    // Mode Buttons
    const modeBtns = this.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        card._setHvacMode(mode);
      });
    });

    // Circular Dial Pointer Events
    const dialContainer = this.querySelector('#dialContainer');
    const dialHandle = this.querySelector('#dialHandle');
    const dialProgress = this.querySelector('#dialProgress');
    const targetTempEl = this.querySelector('#targetTempValue');
    const tickEls = this.querySelectorAll('.dial-tick');
    
    const updateTempFromEvent = (e) => {
      const rect = dialContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (deg < 0) deg += 360;

      let relativeDeg = (deg - 135 + 360) % 360;
      if (relativeDeg > 270) {
        relativeDeg = (relativeDeg < 315) ? 270 : 0;
      }

      const pct = relativeDeg / 270;

      // Handle & Arc Tracking
      const angleDeg = 135 + pct * 270;
      const rad = (angleDeg * Math.PI) / 180;
      const handleX = 120 + 100 * Math.cos(rad);
      const handleY = 120 + 100 * Math.sin(rad);

      dialHandle.setAttribute('cx', handleX.toFixed(2));
      dialHandle.setAttribute('cy', handleY.toFixed(2));

      const totalArc = 471.24;
      const dashOffset = totalArc * (1 - pct);
      dialProgress.style.strokeDashoffset = dashOffset;

      const totalTicks = 28;
      const activeTicks = Math.round(pct * totalTicks);
      const mode = card._stateObj.state || 'off';
      tickEls.forEach((tick, idx) => {
        if (idx <= activeTicks && mode !== 'off') {
          tick.classList.add('active');
        } else {
          tick.classList.remove('active');
        }
      });

      // Quantized Temperature Calculation
      const minTemp = card._stateObj.attributes.min_temp !== undefined ? card._stateObj.attributes.min_temp : 7;
      const maxTemp = card._stateObj.attributes.max_temp !== undefined ? card._stateObj.attributes.max_temp : 35;
      const step = card._stateObj.attributes.target_temp_step || 0.5;

      let newTemp = minTemp + pct * (maxTemp - minTemp);
      newTemp = Math.round(newTemp / step) * step;
      newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));
      
      if (step % 1 === 0) {
        newTemp = Math.round(newTemp);
      } else {
        newTemp = parseFloat(newTemp.toFixed(1));
      }

      if (targetTempEl) {
        targetTempEl.innerText = newTemp;
      }

      if (card._stateObj.attributes.temperature !== newTemp) {
        card._stateObj.attributes.temperature = newTemp;
        
        if (card._hass && card._config.entity) {
          card._hass.callService('climate', 'set_temperature', {
            entity_id: card._config.entity,
            temperature: newTemp
          });
        }

        card.dispatchEvent(new CustomEvent('climate-change', {
          detail: { type: 'temperature', value: newTemp },
          bubbles: true
        }));
      }
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      card._isDragging = true;
      dialContainer.classList.add('dragging');
      try {
        dialContainer.setPointerCapture(e.pointerId);
      } catch (err) {}

      updateTempFromEvent(e);
    };

    const onPointerMove = (e) => {
      if (card._isDragging) {
        updateTempFromEvent(e);
      }
    };

    const onPointerUp = (e) => {
      if (card._isDragging) {
        card._isDragging = false;
        dialContainer.classList.remove('dragging');
        try {
          dialContainer.releasePointerCapture(e.pointerId);
        } catch (err) {}
        card.updateUI();
      }
    };

    dialContainer.addEventListener('pointerdown', onPointerDown);
    dialContainer.addEventListener('pointermove', onPointerMove);
    dialContainer.addEventListener('pointerup', onPointerUp);
    dialContainer.addEventListener('pointercancel', onPointerUp);
  }

  _adjustTemp(delta) {
    const attr = this._stateObj.attributes;
    const currentTarget = attr.temperature !== undefined ? attr.temperature : 16;
    const step = attr.target_temp_step || 0.5;
    const minTemp = attr.min_temp !== undefined ? attr.min_temp : 7;
    const maxTemp = attr.max_temp !== undefined ? attr.max_temp : 35;
    
    let newTemp = currentTarget + delta;
    newTemp = Math.round(newTemp / step) * step;
    newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));

    if (step % 1 === 0) {
      newTemp = Math.round(newTemp);
    } else {
      newTemp = parseFloat(newTemp.toFixed(1));
    }

    this._setTargetTemperature(newTemp);
  }

  _setTargetTemperature(newTemp) {
    this._stateObj.attributes.temperature = newTemp;
    this.updateUI();

    if (this._hass && this._config.entity) {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.entity,
        temperature: newTemp
      });
    }

    this.dispatchEvent(new CustomEvent('climate-change', {
      detail: { type: 'temperature', value: newTemp },
      bubbles: true
    }));
  }

  _setHvacMode(mode) {
    this._stateObj.state = mode;
    
    if (mode === 'heat') this._stateObj.attributes.hvac_action = 'heating';
    else if (mode === 'cool') this._stateObj.attributes.hvac_action = 'cooling';
    else if (mode === 'off') this._stateObj.attributes.hvac_action = 'off';
    else this._stateObj.attributes.hvac_action = 'idle';

    this.updateUI();

    if (this._hass && this._config.entity) {
      this._hass.callService('climate', 'set_hvac_mode', {
        entity_id: this._config.entity,
        hvac_mode: mode
      });
    }

    this.dispatchEvent(new CustomEvent('climate-change', {
      detail: { type: 'hvac_mode', value: mode },
      bubbles: true
    }));
  }

  // Update UI Elements
  updateUI() {
    const stateObj = this._stateObj;
    const attr = stateObj.attributes;
    const mode = stateObj.state || 'off';
    const action = attr.hvac_action || (mode === 'off' ? 'off' : 'idle');
    const unit = attr.unit_of_measurement || '°C';
    const targetTemp = attr.temperature !== undefined ? attr.temperature : 16;
    const currentTemp = attr.current_temperature !== undefined ? attr.current_temperature : 21.6;
    const humidity = attr.current_humidity !== undefined ? attr.current_humidity : 55;

    // Apply Mode Theme Class to Main Card Container
    const cardContainer = this.querySelector('#cardContainer');
    cardContainer.className = `ha-climate-card mode-${mode}`;

    // Centered Friendly Name
    const friendlyName = attr.friendly_name || 'First Floor Thermostat';
    this.querySelector('#friendlyName').innerText = friendlyName;

    // System Status Badge
    const demandBadge = this.querySelector('#demandBadge');
    const demandText = this.querySelector('#demandText');

    demandBadge.className = `demand-badge ${action}`;
    demandText.innerText = action.toUpperCase();

    // Mode-Based Active Demand Entity
    const isCoolingMode = (mode === 'cool' || action === 'cooling');
    const activeDemandObj = isCoolingMode ? this._coolingDemandObj : this._heatingDemandObj;
    const demandLabelText = isCoolingMode ? 'Outdoor Cooling Demand' : 'Outdoor Heating Demand';

    const demandValRaw = parseFloat(activeDemandObj.state) || 0;
    const demandValClamped = Math.max(0, Math.min(100, demandValRaw));
    
    const demandMeterLabelEl = this.querySelector('#demandMeterLabel');
    const heatpumpValEl = this.querySelector('#heatpumpDemandVal');
    const heatpumpFillEl = this.querySelector('#heatpumpDemandFill');

    if (demandMeterLabelEl) demandMeterLabelEl.innerText = demandLabelText;

    if (heatpumpValEl && heatpumpFillEl) {
      heatpumpValEl.innerText = `${demandValClamped.toFixed(0)}%`;
      heatpumpFillEl.style.width = `${demandValClamped}%`;
    }

    // Direct Target Setpoint Text Display Update
    const targetTempEl = this.querySelector('#targetTempValue');
    if (targetTempEl) {
      targetTempEl.innerText = targetTemp;
    }

    this.querySelector('#tempUnit').innerText = unit;
    this.querySelector('#currentTempValue').innerText = `${currentTemp}${unit}`;

    // Centered Humidity Display Below Current Temp
    const humidityValueEl = this.querySelector('#humidityValue');
    if (humidityValueEl) {
      humidityValueEl.innerText = `${humidity}% Humidity`;
    }

    // Circular Dial Progress Range & Ticks
    const minTemp = attr.min_temp !== undefined ? attr.min_temp : 7;
    const maxTemp = attr.max_temp !== undefined ? attr.max_temp : 35;
    const pct = Math.max(0, Math.min(1, (targetTemp - minTemp) / (maxTemp - minTemp)));
    
    const totalArc = 471.24;
    const dashOffset = totalArc * (1 - pct);

    const dialProgress = this.querySelector('#dialProgress');
    dialProgress.style.strokeDasharray = `471.24 628.32`;
    dialProgress.style.strokeDashoffset = dashOffset;

    // Highlight radial tick marks up to target percentage
    const totalTicks = 28;
    const activeTicks = Math.round(pct * totalTicks);
    const tickEls = this.querySelectorAll('.dial-tick');
    tickEls.forEach((tick, idx) => {
      if (idx <= activeTicks && mode !== 'off') {
        tick.classList.add('active');
      } else {
        tick.classList.remove('active');
      }
    });

    // Position Draggable Target Handle (cx, cy)
    const angleDeg = 135 + pct * 270;
    const rad = (angleDeg * Math.PI) / 180;
    const handleX = 120 + 100 * Math.cos(rad);
    const handleY = 120 + 100 * Math.sin(rad);

    const dialHandle = this.querySelector('#dialHandle');
    dialHandle.setAttribute('cx', handleX.toFixed(2));
    dialHandle.setAttribute('cy', handleY.toFixed(2));

    // Position Current Room Temp Indicator Pin
    const pctCurrent = Math.max(0, Math.min(1, (currentTemp - minTemp) / (maxTemp - minTemp)));
    const pinAngleDeg = 135 + pctCurrent * 270;
    const pinRad = (pinAngleDeg * Math.PI) / 180;
    const pinX = 120 + 100 * Math.cos(pinRad);
    const pinY = 120 + 100 * Math.sin(pinRad);

    const currentPin = this.querySelector('#currentPin');
    if (currentPin) {
      currentPin.setAttribute('cx', pinX.toFixed(2));
      currentPin.setAttribute('cy', pinY.toFixed(2));
    }

    // Active Mode Button Highlight
    const modeBtns = this.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      const btnMode = btn.getAttribute('data-mode');
      if (btnMode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// Register Web Component
if (!customElements.get('climate-card')) {
  customElements.define('climate-card', ClimateCard);
}

// Home Assistant Lovelace Card Picker Registration
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'climate-card',
  name: 'Custom Climate Control Card',
  description: 'Clean climate card with centered title, dial humidity, and no entity IDs.',
  preview: true
});
