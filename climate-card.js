/**
 * Home Assistant Custom Climate Card
 * Author: Antigravity AI
 * Card Type: custom:climate-card
 * Features:
 * - Centered Entity Friendly Name (no entity IDs displayed)
 * - Centered Humidity display below current temperature inside the dial
 * - Removed HVAC Mode header text label
 * - Mode-based active demand gauge and thermostat circular slider
 * - Embedded CSS styles for standalone Home Assistant rendering
 */

const CARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  climate-card {
    display: block;
  }

  .ha-climate-card {
    --font-primary: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    
    --bg-dark: #090d16;
    --card-bg: var(--ha-card-background, var(--card-background-color, rgba(20, 27, 44, 0.88)));
    --card-border: var(--ha-card-border-color, rgba(255, 255, 255, 0.08));
    --card-shadow: var(--ha-card-box-shadow, 0 16px 45px rgba(0, 0, 0, 0.45));
    
    --text-primary: var(--primary-text-color, #f8fafc);
    --text-secondary: var(--secondary-text-color, #94a3b8);
    --text-muted: var(--disabled-text-color, #64748b);

    --btn-adjust-bg: rgba(255, 255, 255, 0.06);
    --btn-adjust-border: rgba(255, 255, 255, 0.12);
    --dial-track-color: rgba(255, 255, 255, 0.06);
    --dial-tick-color: rgba(255, 255, 255, 0.12);
    --demand-bg: rgba(0, 0, 0, 0.2);

    --mode-heat-color: #ff9800;
    --mode-heat-gradient: linear-gradient(135deg, #ffb74d, #f57c00);
    --mode-heat-bg: rgba(255, 152, 0, 0.15);
    --mode-heat-border: rgba(255, 152, 0, 0.4);

    --mode-cool-color: #00bcd4;
    --mode-cool-gradient: linear-gradient(135deg, #4dd0e1, #0097a7);
    --mode-cool-bg: rgba(0, 188, 212, 0.15);
    --mode-cool-border: rgba(0, 188, 212, 0.4);

    --mode-off-color: #78909c;
    --mode-off-gradient: linear-gradient(135deg, #90a4ae, #546e7a);
    --mode-off-bg: rgba(120, 144, 156, 0.12);
    --mode-off-border: rgba(120, 144, 156, 0.25);
    
    --radius-xl: 28px;
    --radius-lg: 20px;
    --radius-md: 14px;
    --radius-sm: 10px;
    
    --transition-fast: 0.18s ease;
    --transition-normal: 0.35s ease;

    background: var(--card-bg);
    border: 1px solid var(--card-border);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: 1.75rem;
    box-shadow: var(--card-shadow);
    position: relative;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    transition: border-color var(--transition-normal), background var(--transition-normal), color var(--transition-normal);
    box-sizing: border-box;
    font-family: var(--font-primary);
  }

  .ha-climate-card * {
    box-sizing: border-box;
    font-family: var(--font-primary);
  }

  @media (prefers-color-scheme: light) {
    .ha-climate-card {
      --bg-dark: #f1f5f9;
      --card-bg: var(--ha-card-background, var(--card-background-color, rgba(255, 255, 255, 0.95)));
      --card-border: var(--ha-card-border-color, rgba(0, 0, 0, 0.08));
      --card-shadow: var(--ha-card-box-shadow, 0 16px 40px rgba(0, 0, 0, 0.08));

      --text-primary: var(--primary-text-color, #0f172a);
      --text-secondary: var(--secondary-text-color, #475569);
      --text-muted: var(--disabled-text-color, #94a3b8);

      --btn-adjust-bg: rgba(0, 0, 0, 0.05);
      --btn-adjust-border: rgba(0, 0, 0, 0.1);
      --dial-track-color: rgba(0, 0, 0, 0.07);
      --dial-tick-color: rgba(0, 0, 0, 0.15);
      --demand-bg: rgba(0, 0, 0, 0.04);
    }
  }

  .ha-climate-card.mode-heat {
    border-color: var(--mode-heat-border);
  }

  .ha-climate-card.mode-cool {
    border-color: var(--mode-cool-border);
  }

  .ha-climate-card.mode-off {
    border-color: var(--mode-off-border);
  }

  .ha-climate-card .card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .ha-climate-card .card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.5rem;
  }

  .ha-climate-card .entity-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ha-climate-card .entity-name {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    text-align: center;
  }

  .ha-climate-card .demand-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.85rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    transition: all var(--transition-normal);
  }

  .ha-climate-card .demand-badge.heating {
    background: var(--mode-heat-bg);
    border-color: var(--mode-heat-border);
    color: var(--mode-heat-color);
  }

  .ha-climate-card .demand-badge.cooling {
    background: var(--mode-cool-bg);
    border-color: var(--mode-cool-border);
    color: var(--mode-cool-color);
  }

  .ha-climate-card .demand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .ha-climate-card .dial-container {
    position: relative;
    width: 285px;
    height: 285px;
    margin: 0.25rem auto;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
  }

  .ha-climate-card .dial-svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .ha-climate-card .dial-tick {
    stroke: var(--dial-tick-color);
    stroke-width: 1.8;
    stroke-linecap: round;
    transition: stroke var(--transition-normal);
  }

  .ha-climate-card.mode-heat .dial-tick.active {
    stroke: var(--mode-heat-color);
  }

  .ha-climate-card.mode-cool .dial-tick.active {
    stroke: var(--mode-cool-color);
  }

  .ha-climate-card .dial-track {
    fill: none;
    stroke: var(--dial-track-color);
    stroke-width: 14;
    stroke-linecap: round;
  }

  .ha-climate-card .dial-progress {
    fill: none;
    stroke-width: 14;
    stroke-linecap: round;
  }

  .ha-climate-card.mode-heat .dial-progress {
    stroke: url(#heating-gradient);
  }

  .ha-climate-card.mode-cool .dial-progress {
    stroke: url(#cooling-gradient);
  }

  .ha-climate-card.mode-off .dial-progress {
    stroke: var(--mode-off-color);
  }

  .ha-climate-card .dial-current-pin {
    fill: var(--text-primary);
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1.5;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .ha-climate-card.mode-heat .dial-current-pin {
    fill: #ffcc80;
  }

  .ha-climate-card.mode-cool .dial-current-pin {
    fill: #80deea;
  }

  .ha-climate-card .dial-handle {
    cursor: grab;
    fill: #ffffff;
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 2;
    pointer-events: auto;
  }

  .ha-climate-card .dial-container.dragging .dial-handle {
    cursor: grabbing;
  }

  .ha-climate-card.mode-heat .dial-handle {
    fill: var(--mode-heat-color);
  }

  .ha-climate-card.mode-cool .dial-handle {
    fill: var(--mode-cool-color);
  }

  .ha-climate-card.mode-off .dial-handle {
    fill: var(--mode-off-color);
  }

  .ha-climate-card .dial-center-info {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
    gap: 3px;
  }

  .ha-climate-card .current-temp-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .ha-climate-card .target-temp-display {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    line-height: 1;
    margin: 3px 0;
  }

  .ha-climate-card .target-temp-value {
    font-size: 4rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--text-primary);
    transition: color var(--transition-normal);
  }

  .ha-climate-card.mode-heat .target-temp-value {
    color: var(--mode-heat-color);
  }

  .ha-climate-card.mode-cool .target-temp-value {
    color: var(--mode-cool-color);
  }

  .ha-climate-card .target-temp-unit {
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-top: 0.4rem;
    margin-left: 2px;
  }

  .ha-climate-card .room-temp-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.88rem;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.22rem 0.65rem;
    border-radius: 12px;
    border: 1px solid var(--card-border);
  }

  .ha-climate-card .room-temp-badge strong {
    color: var(--text-primary);
  }

  .ha-climate-card .humidity-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
    font-weight: 500;
    color: #0284c7;
    background: rgba(2, 132, 199, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    border: 1px solid rgba(2, 132, 199, 0.2);
    margin-top: 2px;
  }

  .ha-climate-card .humidity-badge svg {
    width: 13px;
    height: 13px;
    fill: currentColor;
  }

  .ha-climate-card .temp-adjust-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4.5rem;
    margin-top: 0.1rem;
    margin-bottom: 0.25rem;
  }

  .ha-climate-card .btn-adjust {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: var(--btn-adjust-bg);
    border: 1px solid var(--btn-adjust-border);
    color: var(--text-primary);
    font-size: 1.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ha-climate-card .btn-adjust:hover {
    background: rgba(0, 0, 0, 0.12);
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }

  .ha-climate-card .btn-adjust:active {
    transform: scale(0.95);
  }

  .ha-climate-card .heatpump-demand-container {
    background: var(--demand-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ha-climate-card .demand-meter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .ha-climate-card .demand-meter-label {
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ha-climate-card .demand-meter-val {
    color: var(--text-primary);
    font-weight: 700;
    font-size: 0.85rem;
  }

  .ha-climate-card .demand-meter-track {
    width: 100%;
    height: 8px;
    background: var(--dial-track-color);
    border-radius: 4px;
    overflow: hidden;
  }

  .ha-climate-card .demand-meter-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.35s ease, background 0.35s ease;
  }

  .ha-climate-card.mode-heat .demand-meter-fill {
    background: var(--mode-heat-gradient);
  }

  .ha-climate-card.mode-cool .demand-meter-fill {
    background: var(--mode-cool-gradient);
  }

  .ha-climate-card.mode-off .demand-meter-fill {
    background: var(--mode-off-gradient);
  }

  .ha-climate-card .controls-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .ha-climate-card .mode-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .ha-climate-card .mode-btn {
    background: var(--btn-adjust-bg);
    border: 1px solid var(--btn-adjust-border);
    border-radius: var(--radius-md);
    padding: 0.85rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .ha-climate-card .mode-btn svg {
    width: 28px;
    height: 28px;
    transition: transform var(--transition-fast);
  }

  .ha-climate-card .mode-btn[data-mode="heat"] {
    color: #ff9800;
  }

  .ha-climate-card .mode-btn[data-mode="cool"] {
    color: #00bcd4;
  }

  .ha-climate-card .mode-btn[data-mode="off"] {
    color: #78909c;
  }

  .ha-climate-card .mode-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    border-color: var(--text-secondary);
  }

  .ha-climate-card .mode-btn.active {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.25);
  }

  .ha-climate-card .mode-btn[data-mode="heat"].active {
    background: var(--mode-heat-bg);
    border-color: var(--mode-heat-border);
    color: #ffa726;
    box-shadow: 0 4px 15px rgba(255, 152, 0, 0.25);
  }

  .ha-climate-card .mode-btn[data-mode="cool"].active {
    background: var(--mode-cool-bg);
    border-color: var(--mode-cool-border);
    color: #26c6da;
    box-shadow: 0 4px 15px rgba(0, 188, 212, 0.25);
  }

  .ha-climate-card .mode-btn[data-mode="off"].active {
    background: var(--mode-off-bg);
    border-color: var(--mode-off-border);
    color: #90a4ae;
  }
`;

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
      <style>${CARD_STYLES}</style>
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
              <defs>
                <linearGradient id="heating-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffb74d" />
                  <stop offset="100%" stop-color="#f57c00" />
                </linearGradient>
                <linearGradient id="cooling-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#4dd0e1" />
                  <stop offset="100%" stop-color="#0097a7" />
                </linearGradient>
              </defs>
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
    const btnPlus = this.querySelector('#btnPlus');
    const btnMinus = this.querySelector('#btnMinus');
    if (btnPlus) btnPlus.addEventListener('click', () => card._adjustTemp(0.5));
    if (btnMinus) btnMinus.addEventListener('click', () => card._adjustTemp(-0.5));

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
    
    if (!dialContainer) return;

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

      if (dialHandle) {
        dialHandle.setAttribute('cx', handleX.toFixed(2));
        dialHandle.setAttribute('cy', handleY.toFixed(2));
      }

      const totalArc = 471.24;
      const dashOffset = totalArc * (1 - pct);
      if (dialProgress) {
        dialProgress.style.strokeDashoffset = dashOffset;
      }

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
      }
    };

    dialContainer.addEventListener('pointerdown', onPointerDown);
    dialContainer.addEventListener('pointermove', onPointerMove);
    dialContainer.addEventListener('pointerup', onPointerUp);
    dialContainer.addEventListener('pointercancel', onPointerUp);
  }

  _adjustTemp(delta) {
    const attrs = this._stateObj.attributes || {};
    const minTemp = attrs.min_temp !== undefined ? attrs.min_temp : 7;
    const maxTemp = attrs.max_temp !== undefined ? attrs.max_temp : 35;
    const step = attrs.target_temp_step || 0.5;

    let currentTarget = attrs.temperature !== undefined ? attrs.temperature : minTemp;
    let newTemp = currentTarget + delta;
    newTemp = Math.round(newTemp / step) * step;
    newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));

    if (step % 1 === 0) {
      newTemp = Math.round(newTemp);
    } else {
      newTemp = parseFloat(newTemp.toFixed(1));
    }

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

  updateUI() {
    if (!this.querySelector('#cardContainer')) {
      this._renderCardSkeleton();
    }

    const cardContainer = this.querySelector('#cardContainer');
    const friendlyNameEl = this.querySelector('#friendlyName');
    const demandBadge = this.querySelector('#demandBadge');
    const demandText = this.querySelector('#demandText');
    const targetTempEl = this.querySelector('#targetTempValue');
    const tempUnitEl = this.querySelector('#tempUnit');
    const currentTempEl = this.querySelector('#currentTempValue');
    const humidityBadge = this.querySelector('#humidityBadge');
    const humidityValueEl = this.querySelector('#humidityValue');
    const dialHandle = this.querySelector('#dialHandle');
    const dialProgress = this.querySelector('#dialProgress');
    const currentPin = this.querySelector('#currentPin');
    const tickEls = this.querySelectorAll('.dial-tick');
    const demandMeterLabel = this.querySelector('#demandMeterLabel');
    const heatpumpDemandVal = this.querySelector('#heatpumpDemandVal');
    const heatpumpDemandFill = this.querySelector('#heatpumpDemandFill');

    if (!cardContainer) return;

    const stateObj = this._stateObj;
    const attrs = stateObj.attributes || {};
    const mode = stateObj.state || 'off';
    const unit = attrs.unit_of_measurement || '°C';

    // 1. Theme class on main container
    cardContainer.className = `ha-climate-card mode-${mode}`;

    // 2. Friendly Name
    const displayName = this._config.name || attrs.friendly_name || 'Thermostat';
    if (friendlyNameEl) friendlyNameEl.innerText = displayName;

    // 3. Status Badge & HVAC Action
    const hvacAction = attrs.hvac_action || (mode === 'off' ? 'off' : 'idle');
    if (demandBadge) {
      demandBadge.className = 'demand-badge';
      if (hvacAction === 'heating') demandBadge.classList.add('heating');
      if (hvacAction === 'cooling') demandBadge.classList.add('cooling');
    }
    if (demandText) {
      demandText.innerText = hvacAction.toUpperCase();
    }

    // 4. Setpoint Target Display
    const targetTemp = attrs.temperature !== undefined ? attrs.temperature : '--';
    if (targetTempEl) targetTempEl.innerText = targetTemp;
    if (tempUnitEl) tempUnitEl.innerText = unit;

    // 5. Current Room Temperature
    const currentTemp = attrs.current_temperature !== undefined ? attrs.current_temperature : '--';
    if (currentTempEl) currentTempEl.innerText = `${currentTemp}${unit}`;

    // 6. Centered Humidity Display Inside Dial
    let humidityVal = null;
    if (this._config.humidity_entity && this._hass && this._hass.states[this._config.humidity_entity]) {
      humidityVal = this._hass.states[this._config.humidity_entity].state;
    } else if (attrs.current_humidity !== undefined) {
      humidityVal = attrs.current_humidity;
    }

    if (humidityValueEl && humidityBadge) {
      if (humidityVal !== null && humidityVal !== undefined && humidityVal !== 'unavailable' && humidityVal !== 'unknown') {
        humidityValueEl.innerText = `${humidityVal}% Humidity`;
        humidityBadge.style.display = 'inline-flex';
      } else {
        humidityBadge.style.display = 'none';
      }
    }

    // 7. Dial Calculations & Arc Positioning
    const minTemp = attrs.min_temp !== undefined ? attrs.min_temp : 7;
    const maxTemp = attrs.max_temp !== undefined ? attrs.max_temp : 35;
    
    let targetPct = 0.5;
    if (typeof targetTemp === 'number' && maxTemp > minTemp) {
      targetPct = Math.max(0, Math.min(1, (targetTemp - minTemp) / (maxTemp - minTemp)));
    }

    const handleAngleDeg = 135 + targetPct * 270;
    const handleRad = (handleAngleDeg * Math.PI) / 180;
    const handleX = 120 + 100 * Math.cos(handleRad);
    const handleY = 120 + 100 * Math.sin(handleRad);

    if (dialHandle) {
      dialHandle.setAttribute('cx', handleX.toFixed(2));
      dialHandle.setAttribute('cy', handleY.toFixed(2));
    }

    const totalArc = 471.24; // 2 * PI * 100 * (270 / 360) = 471.24
    if (dialProgress) {
      dialProgress.style.strokeDasharray = `${totalArc} ${totalArc}`;
      const dashOffset = totalArc * (1 - targetPct);
      dialProgress.style.strokeDashoffset = dashOffset;
    }

    // Current Temp Pin Positioning
    let currentPct = 0.5;
    if (typeof currentTemp === 'number' && maxTemp > minTemp) {
      currentPct = Math.max(0, Math.min(1, (currentTemp - minTemp) / (maxTemp - minTemp)));
    }
    const pinAngleDeg = 135 + currentPct * 270;
    const pinRad = (pinAngleDeg * Math.PI) / 180;
    const pinX = 120 + 100 * Math.cos(pinRad);
    const pinY = 120 + 100 * Math.sin(pinRad);

    if (currentPin) {
      currentPin.setAttribute('cx', pinX.toFixed(2));
      currentPin.setAttribute('cy', pinY.toFixed(2));
    }

    // Dial Ticks Highlighting
    const totalTicks = 28;
    const activeTicks = Math.round(targetPct * totalTicks);
    tickEls.forEach((tick, idx) => {
      if (idx <= activeTicks && mode !== 'off') {
        tick.classList.add('active');
      } else {
        tick.classList.remove('active');
      }
    });

    // 8. Demand Meter Progress Bar Calculation
    let activeDemand = 0;
    let labelText = 'Outdoor System Demand';

    if (mode === 'heat') {
      labelText = 'Outdoor Heating Demand';
      if (this._heatingDemandObj && !isNaN(parseFloat(this._heatingDemandObj.state))) {
        activeDemand = parseFloat(this._heatingDemandObj.state);
      }
    } else if (mode === 'cool') {
      labelText = 'Outdoor Cooling Demand';
      if (this._coolingDemandObj && !isNaN(parseFloat(this._coolingDemandObj.state))) {
        activeDemand = parseFloat(this._coolingDemandObj.state);
      }
    } else {
      labelText = 'System Demand (Off)';
      activeDemand = 0;
    }

    if (demandMeterLabel) demandMeterLabel.innerText = labelText;
    if (heatpumpDemandVal) heatpumpDemandVal.innerText = `${activeDemand.toFixed(0)}%`;
    if (heatpumpDemandFill) heatpumpDemandFill.style.width = `${Math.min(100, Math.max(0, activeDemand))}%`;

    // 9. Active Mode Button Highlight
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
