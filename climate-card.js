/**
 * Home Assistant Custom Climate Card
 * Author: Antigravity AI
 * Card Type: custom:climate-card
 * Features:
 * - Centered Entity Friendly Name (no entity IDs displayed)
 * - Centered Humidity display below current temperature inside the dial
 * - Mode-based active demand gauge and thermostat circular slider
 * - Verified temperature setpoint change with graceful error handling and retry cap
 * - Slider progress arc strictly clamped between lowest tickmark (150°) and highest tickmark (390°)
 * - Dynamic theme detection supporting Home Assistant darkMode, prefers-color-scheme media queries, and data-theme attributes
 * - Non-destructive Card Editor lifecycle preventing dropdown menu closure on WebSocket state updates
 * - Thermostat entity friendly_name used as default card title with optional custom title override
 */

const CARD_STYLES = `
  :host {
    display: block;
  }

  .ha-climate-card {
    --font-primary: 'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    
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

    --mode-heat-color: #ff7043;
    --mode-heat-gradient: linear-gradient(to right, #7f1d1d, #ff7043);
    --mode-heat-bg: rgba(255, 112, 67, 0.15);
    --mode-heat-border: rgba(255, 112, 67, 0.4);

    --mode-cool-color: #38bdf8;
    --mode-cool-gradient: linear-gradient(to right, #38bdf8, #1e40af);
    --mode-cool-bg: rgba(30, 64, 175, 0.15);
    --mode-cool-border: rgba(56, 189, 248, 0.4);

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
    padding: 1.1rem 1.25rem;
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

  .ha-climate-card.theme-dark,
  .ha-climate-card {
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
  }

  .ha-climate-card.theme-light {
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
    gap: 0.75rem;
  }

  .ha-climate-card .card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.35rem;
  }

  .ha-climate-card .entity-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ha-climate-card .entity-name {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    text-align: center;
  }

  .ha-climate-card .demand-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.72rem;
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
    width: 312px;
    height: 282px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    cursor: pointer;
  }

  .ha-climate-card .dial-svg {
    width: 288px;
    height: 288px;
    pointer-events: none;
    margin-top: -30px;
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

  .ha-climate-card .dial-track,
  svg path.dial-track {
    fill: none !important;
    stroke: var(--dial-track-color);
  }

  #progressGroup path {
    fill: none !important;
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
    padding-top: 14px;
  }

  .ha-climate-card .current-temp-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-top: 10px;
  }

  .ha-climate-card .target-temp-display {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    line-height: 1;
    margin: 3px 0;
    transition: opacity var(--transition-fast);
  }

  @keyframes pulse-pending {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.97); }
  }

  .ha-climate-card .target-temp-display.pending {
    animation: pulse-pending 1.2s infinite ease-in-out;
  }

  .ha-climate-card .target-temp-value {
    font-size: 3.2rem;
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
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-top: 0.35rem;
    margin-left: 2px;
  }

  .ha-climate-card .room-temp-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.18rem 0.55rem;
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
    font-weight: 600;
    color: #bae6fd;
    background: rgba(14, 165, 233, 0.22);
    padding: 0.2rem 0.65rem;
    border-radius: 12px;
    border: 1px solid rgba(56, 189, 248, 0.4);
    margin-top: 3px;
  }

  .ha-climate-card.theme-light .humidity-badge {
    color: #0284c7;
    background: rgba(2, 132, 199, 0.12);
    border-color: rgba(2, 132, 199, 0.3);
  }

  .ha-climate-card .humidity-badge svg {
    width: 13px;
    height: 13px;
    fill: currentColor;
  }

  .ha-climate-card button,
  .ha-climate-card .btn-adjust,
  .ha-climate-card .mode-btn {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }

  .ha-climate-card .btn-adjust {
    position: absolute;
    bottom: -6px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--btn-adjust-bg, rgba(255, 255, 255, 0.08));
    border: 1px solid var(--btn-adjust-border, rgba(255, 255, 255, 0.15));
    color: var(--text-primary, #ffffff);
    font-size: 1.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    z-index: 5;
    pointer-events: auto;
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    padding: 0;
    line-height: 1;
  }

  .ha-climate-card .btn-adjust.btn-minus {
    left: 14px;
  }

  .ha-climate-card .btn-adjust.btn-plus {
    right: 14px;
  }

  .ha-climate-card .btn-adjust:hover {
    background: rgba(0, 0, 0, 0.12);
    border-color: var(--text-secondary);
    color: var(--text-primary);
  }

  .ha-climate-card .btn-adjust:active {
    transform: scale(0.92);
  }

  .ha-climate-card .heatpump-demand-container {
    background: var(--demand-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    padding: 0.55rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ha-climate-card .demand-meter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
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
    font-size: 0.82rem;
  }

  .ha-climate-card .demand-meter-track {
    width: 100%;
    height: 6px;
    background: var(--dial-track-color);
    border-radius: 3px;
    overflow: hidden;
  }

  .ha-climate-card .demand-meter-fill {
    height: 100%;
    border-radius: 3px;
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
    gap: 0.5rem;
  }

  .ha-climate-card .mode-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
  }

  .ha-climate-card .mode-btn {
    background: var(--btn-adjust-bg);
    border: 1px solid var(--btn-adjust-border);
    border-radius: var(--radius-md);
    padding: 0.55rem 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .ha-climate-card .mode-btn svg {
    width: 22px !important;
    height: 22px !important;
    max-width: 22px !important;
    max-height: 22px !important;
    display: block !important;
    transition: transform var(--transition-fast);
  }

  .ha-climate-card .mode-btn[data-mode="heat"] {
    color: #ff7043;
  }

  .ha-climate-card .mode-btn[data-mode="cool"] {
    color: #38bdf8;
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
    color: #ff7043;
    box-shadow: 0 4px 15px rgba(255, 112, 67, 0.25);
  }

  .ha-climate-card .mode-btn[data-mode="cool"].active {
    background: var(--mode-cool-bg);
    border-color: var(--mode-cool-border);
    color: #38bdf8;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.25);
  }

  .ha-climate-card .mode-btn[data-mode="off"].active {
    background: var(--mode-off-bg);
    border-color: var(--mode-off-border);
    color: #90a4ae;
  }
`;

const CLIMATE_CARD_VERSION = '2026.10.06-v9';
console.info(`%c CLIMATE-CARD %c ${CLIMATE_CARD_VERSION} `, 'background:#ff7043;color:#fff;font-weight:700', 'background:#1e293b;color:#fff');

class ClimateCard extends HTMLElement {
  // SVG arc path along r=100 circle centred at (120,120); angles in degrees, clockwise (screen coords)
  static _arcPath(a0, a1) {
    const r = 100, cx = 120, cy = 120;
    const p = (a) => {
      const rad = (a * Math.PI) / 180;
      return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
    };
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M ${p(a0)} A ${r} ${r} 0 ${large} 1 ${p(a1)}`;
  }

  static _lerpColor(c0, c1, t) {
    const h = (c) => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
    const a = h(c0), b = h(c1);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // Heat: dark red (lowest) -> orange (highest). Cool: light blue (lowest) -> dark blue (highest).
  static _modeColor(mode, t) {
    if (mode === 'heat') return ClimateCard._lerpColor('#7f1d1d', '#ff7043', t);
    if (mode === 'cool') return ClimateCard._lerpColor('#38bdf8', '#1e40af', t);
    return '#78909c';
  }

  _renderProgress(pct, mode) {
    const group = this.shadowRoot && this.shadowRoot.querySelector('#progressGroup');
    if (!group) return;
    const START = 150, SPAN = 240, SEGMENTS = 48;
    const end = START + SPAN * pct;
    let svg = '';
    if (pct > 0.001) {
      const step = SPAN / SEGMENTS;
      for (let a = START; a < end - 0.01; a += step) {
        const a1 = Math.min(a + step, end);
        const t = ((a + a1) / 2 - START) / SPAN;
        // +0.6deg overlap hides anti-aliasing seams between segments
        const a1o = Math.min(a1 + 0.6, end);
        svg += `<path d="${ClimateCard._arcPath(a, a1o)}" fill="none" style="fill: none !important;" stroke="${ClimateCard._modeColor(mode, t)}" stroke-width="14" stroke-linecap="butt" />`;
      }
    }
    // Round start cap (always drawn so the arc begins at the lowest tickmark)
    const capRad = (START * Math.PI) / 180;
    svg += `<circle cx="${(120 + 100 * Math.cos(capRad)).toFixed(2)}" cy="${(120 + 100 * Math.sin(capRad)).toFixed(2)}" r="7" fill="${ClimateCard._modeColor(mode, 0)}" />`;
    group.innerHTML = svg;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {
      entity: 'climate.first_floor',
      heating_demand_entity: 'sensor.first_floor_outdoor_heat_pump_demand',
      cooling_demand_entity: 'sensor.first_floor_outdoor_cooling_demand'
    };
    this._hass = null;
    this._isDragging = false;
    this._lastDraggedTemp = null;
    this._isPendingTempChange = false;
    this._pendingTargetTemp = null;
    this._activeRetryController = null;
    this._themeObserver = null;
    
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

  static getConfigElement() {
    return document.createElement('climate-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'climate.first_floor',
      heating_demand_entity: 'sensor.first_floor_outdoor_heat_pump_demand',
      cooling_demand_entity: 'sensor.first_floor_outdoor_cooling_demand'
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = {
      entity: config.entity || 'climate.first_floor',
      heating_demand_entity: config.heating_demand_entity || 'sensor.first_floor_outdoor_heat_pump_demand',
      cooling_demand_entity: config.cooling_demand_entity || 'sensor.first_floor_outdoor_cooling_demand',
      ...config
    };
    if (this.shadowRoot && this.shadowRoot.querySelector('#cardContainer')) {
      this.updateUI();
    } else {
      this._renderCardSkeleton();
      this.updateUI();
    }
  }

  set hass(hass) {
    this._hass = hass;
    let needsUpdate = false;

    if (hass && this._config.entity && hass.states[this._config.entity]) {
      const stateObj = hass.states[this._config.entity];
      
      const unitFromConfig = hass.config && hass.config.unit_system ? hass.config.unit_system.temperature : null;
      const unitFromAttr = stateObj.attributes ? stateObj.attributes.unit_of_measurement : null;
      const detectedUnit = unitFromConfig || unitFromAttr || '°C';
      
      const incomingTemp = stateObj.attributes ? stateObj.attributes.temperature : null;

      // Handle pending temperature change verification (keep pulse active for 5 seconds)
      if (this._isPendingTempChange) {
        if (Date.now() >= (this._pendingUntilTime || 0)) {
          this._isPendingTempChange = false;
          const targetTempDisplay = this.shadowRoot ? this.shadowRoot.querySelector('.target-temp-display') : null;
          if (targetTempDisplay) targetTempDisplay.classList.remove('pending');
        } else {
          // Keep showing pending target temp until 5s window completes
          stateObj.attributes = {
            ...stateObj.attributes,
            temperature: this._pendingTargetTemp
          };
        }
      }

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
    if (!this.shadowRoot.querySelector('.ha-climate-card')) {
      this._renderCardSkeleton();
    }

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', () => this.updateUI());
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(() => this.updateUI());
      }
    }

    if (window.MutationObserver && document.documentElement) {
      this._themeObserver = new MutationObserver(() => this.updateUI());
      this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    }

    this.updateUI();
  }

  disconnectedCallback() {
    if (this._themeObserver) {
      this._themeObserver.disconnect();
      this._themeObserver = null;
    }
  }

  _renderCardSkeleton() {
    let ticksHtml = '';
    const totalTicks = 28;
    for (let i = 0; i <= totalTicks; i++) {
      const pct = i / totalTicks;
      const angleDeg = 150 + pct * 240;
      const rad = (angleDeg * Math.PI) / 180;
      
      const x1 = 120 + 84 * Math.cos(rad);
      const y1 = 120 + 84 * Math.sin(rad);
      const x2 = 120 + 92 * Math.cos(rad);
      const y2 = 120 + 92 * Math.sin(rad);
      
      ticksHtml += `<line class="dial-tick" data-index="${i}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    }

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <div class="ha-climate-card" id="cardContainer">
        <div class="card-content">
          
          <!-- Centered Header (No Entity IDs) -->
          <div class="card-header">
            <div class="entity-info">
              <div class="entity-name" id="friendlyName">First Floor Thermostat</div>
            </div>
          </div>

          <!-- Thermostat Circular Dial (Upside-Down Horseshoe Arc) -->
          <div class="dial-container" id="dialContainer">
            <svg class="dial-svg" viewBox="0 0 240 240" width="288" height="288" style="width: 288px; height: 288px; max-width: 100%; display: block; margin: -30px auto 0 auto; pointer-events: none;">
              <!-- Radial Tick Marks -->
              <g class="dial-ticks-group" id="ticksGroup">
                ${ticksHtml}
              </g>

              <!-- Track: explicit 240deg arc path (150deg -> 390deg), fill: none !important inline -->
              <path class="dial-track" d="${ClimateCard._arcPath(150, 390)}" fill="none" style="fill: none !important;" stroke="rgba(128,128,128,0.18)" stroke-width="14" stroke-linecap="round" />
              <!-- Progress Arc: solid-color segments rendered by JS (no gradients / url() refs) -->
              <g id="progressGroup"></g>
              
              <!-- Current Room Temp Indicator Pin -->
              <circle class="dial-current-pin" id="currentPin" cx="120" cy="120" r="4.5" fill="#ffffff" />

              <!-- Setpoint Target Handle -->
              <circle class="dial-handle" id="dialHandle" cx="33.4" cy="170" r="14" fill="#ffffff" />
            </svg>

            <!-- Center Info -->
            <div class="dial-center-info" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; gap: 3px; padding-top: 14px;">
              <!-- System Status Badge Above Target Temp -->
              <div class="demand-badge" id="demandBadge" style="margin-bottom: 2px;">
                <span class="demand-dot"></span>
                <span id="demandText">IDLE</span>
              </div>

              <span class="current-temp-label" id="modeSublabel" style="margin-top: 10px;">TARGET TEMP</span>
              <div class="target-temp-display" style="display: flex; align-items: flex-start; justify-content: center; line-height: 1; margin: 3px 0;">
                <span class="target-temp-value" id="targetTempValue">16</span>
                <span class="target-temp-unit" id="tempUnit">°C</span>
              </div>
              <div class="room-temp-badge" style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.82rem; padding: 0.18rem 0.55rem; border-radius: 12px;">
                Current: <strong id="currentTempValue">21.6°C</strong>
              </div>

              <!-- Centered Humidity Display Below Current Temp -->
              <div class="humidity-badge" id="humidityBadge">
                <svg viewBox="0 0 24 24" width="13" height="13" style="width: 13px; height: 13px; max-width: 13px; max-height: 13px; display: inline-block; fill: currentColor;"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" fill="currentColor"/></svg>
                <span id="humidityValue">55% Humidity</span>
              </div>
            </div>

            <!-- Fine Adjust Buttons (- / +) Tucked into Bottom Left / Bottom Right Low & High Break Points -->
            <button class="btn-adjust btn-minus" id="btnMinus" aria-label="Decrease Temperature" style="position: absolute; bottom: -6px; left: 14px; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; pointer-events: auto;">−</button>
            <button class="btn-adjust btn-plus" id="btnPlus" aria-label="Increase Temperature" style="position: absolute; bottom: -6px; right: 14px; width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; pointer-events: auto;">+</button>
          </div>

          <!-- Dynamic Mode-Based Outdoor Demand Gauge Meter -->
          <div class="heatpump-demand-container" id="heatpumpDemandSection">
            <div class="demand-meter-header" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
              <span class="demand-meter-label" id="demandMeterLabel">Outdoor Heating Demand</span>
              <span class="demand-meter-val" id="heatpumpDemandVal">0%</span>
            </div>
            <div class="demand-meter-track" style="width: 100%; height: 6px; border-radius: 3px; overflow: hidden;">
              <div class="demand-meter-fill" id="heatpumpDemandFill" style="width: 0%; height: 100%; border-radius: 3px;"></div>
            </div>
          </div>

          <!-- HVAC Mode Buttons Grid (Without 'HVAC Mode' header text label) -->
          <div class="controls-section">
            <div class="mode-grid" id="modeGrid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.65rem;">
              <button class="mode-btn" data-mode="heat" title="Heat (Flame)" aria-label="Heat Mode">
                <!-- Crisp MDI Fire Flame Icon -->
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="width: 22px; height: 22px; max-width: 22px; max-height: 22px; display: block; margin: auto;">
                  <path d="M12 2.1c-.2 0-.4.1-.5.3-1.6 2.5-3.5 4.8-4.5 7.8-1 3 0 6.2 2.2 8.3 2.2 2.1 5.4 2.5 8.1 1 2.7-1.5 4.2-4.6 3.7-7.7-.5-3.1-2.6-5.7-4.5-8.2-.3-.4-.8-.7-1.3-.7-.2 0-.4.1-.5.3-1 1.7-2 3.4-2.7 5.2-.2.5-.9.6-1.2.2-.5-.6-.9-1.3-1.3-2-.3-.5-.7-1-1.1-1.5-.3-.4-.5-1.4-.2z"/>
                </svg>
              </button>
              <button class="mode-btn" data-mode="cool" title="Cool (Traditional Ice Crystal)" aria-label="Cool Mode">
                <!-- Traditional 6-Axis Rotated Ice Crystal Snowflake Icon (Outward Forks, No Core Polygon) -->
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; max-width: 22px; max-height: 22px; display: block; margin: auto;">
                  <!-- 6 Rotated Symmetric Ice Crystal Rays with Outward-Pointing Forks -->
                  <g transform="rotate(0 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                  <g transform="rotate(60 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                  <g transform="rotate(120 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                  <g transform="rotate(180 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                  <g transform="rotate(240 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                  <g transform="rotate(300 12 12)">
                    <line x1="12" y1="12" x2="12" y2="2.2" />
                    <polyline points="9.0 4.2 12 6.0 15.0 4.2" />
                    <polyline points="9.5 8.2 12 9.8 14.5 8.2" />
                  </g>
                </svg>
              </button>
              <button class="mode-btn" data-mode="off" title="Turn Off" aria-label="Turn Off">
                <!-- Power Icon -->
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 22px; height: 22px; max-width: 22px; max-height: 22px; display: block; margin: auto;">
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
    const root = this.shadowRoot;
    if (!root) return;
    
    // Plus / Minus Buttons
    const btnPlus = root.querySelector('#btnPlus');
    const btnMinus = root.querySelector('#btnMinus');
    if (btnPlus) {
      btnPlus.addEventListener('pointerdown', (e) => e.stopPropagation());
      btnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        card._adjustTemp(0.5);
      });
    }
    if (btnMinus) {
      btnMinus.addEventListener('pointerdown', (e) => e.stopPropagation());
      btnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        card._adjustTemp(-0.5);
      });
    }

    // Mode Buttons
    const modeBtns = root.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        card._setHvacMode(mode);
      });
    });

    // Circular Dial Pointer Events
    const dialContainer = root.querySelector('#dialContainer');
    const dialHandle = root.querySelector('#dialHandle');
    const dialProgress = root.querySelector('#dialProgress');
    const targetTempEl = root.querySelector('#targetTempValue');
    const tickEls = root.querySelectorAll('.dial-tick');
    
    if (!dialContainer) return;

    const updateTempFromEvent = (e) => {
      const rect = dialContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      
      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (deg < 0) deg += 360;

      let relativeDeg = (deg - 150 + 360) % 360;
      if (relativeDeg > 240) {
        relativeDeg = (relativeDeg < 300) ? 240 : 0;
      }

      // Strictly clamp percentage between lowest tickmark (0.0 at 150°) and highest tickmark (1.0 at 390°)
      const pct = Math.max(0, Math.min(1, relativeDeg / 240));

      // Handle & Arc Tracking
      const angleDeg = 150 + pct * 240;
      const rad = (angleDeg * Math.PI) / 180;
      const handleX = 120 + 100 * Math.cos(rad);
      const handleY = 120 + 100 * Math.sin(rad);

      if (dialHandle) {
        dialHandle.setAttribute('cx', handleX.toFixed(2));
        dialHandle.setAttribute('cy', handleY.toFixed(2));
      }

      // Progress arc: solid-color segments strictly between lowest (150°) and highest (390°) tickmarks
      card._renderProgress(pct, card._stateObj.state || 'off');
      if (dialHandle) dialHandle.setAttribute('fill', ClimateCard._modeColor(card._stateObj.state || 'off', pct));

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

      card._lastDraggedTemp = newTemp;
    };

    const onPointerDown = (e) => {
      if (e.target && e.target.closest('.btn-adjust')) return;
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

        if (card._lastDraggedTemp !== undefined && card._lastDraggedTemp !== null) {
          card._commitTemperatureChange(card._lastDraggedTemp);
        }
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
    const currentTarget = this._isPendingTempChange
      ? this._pendingTargetTemp
      : (attrs.temperature !== undefined ? attrs.temperature : minTemp);

    let newTemp = currentTarget + delta;
    this._commitTemperatureChange(newTemp);
  }

  _commitTemperatureChange(targetTemp) {
    const attrs = this._stateObj.attributes || {};
    const minTemp = attrs.min_temp !== undefined ? attrs.min_temp : 7;
    const maxTemp = attrs.max_temp !== undefined ? attrs.max_temp : 35;
    const step = attrs.target_temp_step || 0.5;

    targetTemp = Math.round(targetTemp / step) * step;
    targetTemp = Math.max(minTemp, Math.min(maxTemp, targetTemp));
    targetTemp = (step % 1 === 0) ? Math.round(targetTemp) : parseFloat(targetTemp.toFixed(1));

    this._pendingTargetTemp = targetTemp;
    this._isPendingTempChange = true;
    this._pendingUntilTime = Date.now() + 5000;

    // Show immediate target readout with pending pulse animation for 5 seconds
    const targetTempEl = this.shadowRoot ? this.shadowRoot.querySelector('#targetTempValue') : null;
    const targetTempDisplay = this.shadowRoot ? this.shadowRoot.querySelector('.target-temp-display') : null;
    if (targetTempEl) targetTempEl.innerText = targetTemp;
    if (targetTempDisplay) targetTempDisplay.classList.add('pending');

    if (this._pulseTimer) {
      clearTimeout(this._pulseTimer);
    }
    this._pulseTimer = setTimeout(() => {
      if (Date.now() >= (this._pendingUntilTime || 0)) {
        this._isPendingTempChange = false;
        const targetDisplay = this.shadowRoot ? this.shadowRoot.querySelector('.target-temp-display') : null;
        if (targetDisplay) targetDisplay.classList.remove('pending');
        this.updateUI();
      }
    }, 5000);

    this.dispatchEvent(new CustomEvent('climate-change', {
      detail: { type: 'temperature', value: targetTemp },
      bubbles: true
    }));

    this._sendSetTemperatureWithRetry(targetTemp);
  }

  async _sendSetTemperatureWithRetry(targetTemp) {
    if (this._activeRetryController) {
      this._activeRetryController.cancelled = true;
    }

    if (this._pendingTimeoutTimer) {
      clearTimeout(this._pendingTimeoutTimer);
      this._pendingTimeoutTimer = null;
    }

    const controller = { cancelled: false };
    this._activeRetryController = controller;

    let success = false;
    try {
      if (this._hass && this._config.entity) {
        const serviceData = {
          entity_id: this._config.entity,
          temperature: parseFloat(targetTemp)
        };

        const currentMode = this._stateObj ? this._stateObj.state : null;
        if (currentMode === 'auto' || currentMode === 'heat_cool') {
          serviceData.target_temp_low = targetTemp - 1;
          serviceData.target_temp_high = targetTemp + 1;
        }

        // Issue set_temperature service call to Home Assistant
        await this._hass.callService('climate', 'set_temperature', serviceData);
        success = true;
      } else {
        // Standalone / Simulator fallback
        success = true;
      }
    } catch (err) {
      console.warn(`[ClimateCard] set_temperature failed:`, err);
    }

    if (controller.cancelled) return;

    if (success) {
      this._stateObj.attributes.temperature = targetTemp;
      // Keep pending lock active so incoming HA state updates won't bounce back old temp before cloud sync completes
      this._pendingTimeoutTimer = setTimeout(() => {
        if (!controller.cancelled && Date.now() >= (this._pendingUntilTime || 0)) {
          this._isPendingTempChange = false;
          const targetTempDisplay = this.shadowRoot ? this.shadowRoot.querySelector('.target-temp-display') : null;
          if (targetTempDisplay) targetTempDisplay.classList.remove('pending');
          if (this._hass && this._config.entity && this._hass.states[this._config.entity]) {
            const currentEntity = this._hass.states[this._config.entity];
            if (currentEntity && currentEntity.attributes && currentEntity.attributes.temperature !== undefined) {
              this._stateObj.attributes.temperature = currentEntity.attributes.temperature;
            }
          }
          this.updateUI();
        }
      }, 5000);
    } else {
      this._isPendingTempChange = false;
      const targetTempDisplay = this.shadowRoot.querySelector('.target-temp-display');
      if (targetTempDisplay) targetTempDisplay.classList.remove('pending');
      // Revert display back to actual Home Assistant entity temperature on error
      if (this._hass && this._config.entity && this._hass.states[this._config.entity]) {
        const currentEntity = this._hass.states[this._config.entity];
        if (currentEntity && currentEntity.attributes && currentEntity.attributes.temperature !== undefined) {
          this._stateObj.attributes.temperature = currentEntity.attributes.temperature;
        }
      }
    }

    this.updateUI();
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
    if (!this.shadowRoot || !this.shadowRoot.querySelector('#cardContainer')) {
      this._renderCardSkeleton();
    }

    const root = this.shadowRoot;
    const cardContainer = root.querySelector('#cardContainer');
    const friendlyNameEl = root.querySelector('#friendlyName');
    const demandBadge = root.querySelector('#demandBadge');
    const demandText = root.querySelector('#demandText');
    const targetTempEl = root.querySelector('#targetTempValue');
    const tempUnitEl = root.querySelector('#tempUnit');
    const currentTempEl = root.querySelector('#currentTempValue');
    const humidityBadge = root.querySelector('#humidityBadge');
    const humidityValueEl = root.querySelector('#humidityValue');
    const dialHandle = root.querySelector('#dialHandle');
    const dialProgress = root.querySelector('#dialProgress');
    const currentPin = root.querySelector('#currentPin');
    const tickEls = root.querySelectorAll('.dial-tick');
    const demandMeterLabel = root.querySelector('#demandMeterLabel');
    const heatpumpDemandVal = root.querySelector('#heatpumpDemandVal');
    const heatpumpDemandFill = root.querySelector('#heatpumpDemandFill');

    if (!cardContainer) return;

    const stateObj = this._stateObj;
    const attrs = stateObj.attributes || {};
    const mode = stateObj.state || 'off';
    const unit = attrs.unit_of_measurement || '°C';

    // 1. Dynamic Theme & Mode class assignment
    let isDark = false;
    const docAttr = document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme');
    if (docAttr === 'dark') {
      isDark = true;
    } else if (docAttr === 'light') {
      isDark = false;
    } else if (this._hass) {
      if (this._hass.darkMode !== undefined) {
        isDark = this._hass.darkMode;
      } else if (this._hass.themes && this._hass.themes.darkMode !== undefined) {
        isDark = this._hass.themes.darkMode;
      } else {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    const themeClass = isDark ? 'theme-dark' : 'theme-light';
    cardContainer.className = `ha-climate-card mode-${mode} ${themeClass}`;

    // 2. Friendly Name / Title: Default to thermostat entity name unless custom title is set
    const entityFriendlyName = (attrs && attrs.friendly_name) ? attrs.friendly_name : 'Thermostat';
    const hasCustomTitle = (this._config.title !== undefined && this._config.title !== null && this._config.title.trim() !== '')
      || (this._config.name !== undefined && this._config.name !== null && this._config.name.trim() !== '');
    
    const displayName = hasCustomTitle
      ? (this._config.title !== undefined && this._config.title !== null && this._config.title.trim() !== '' ? this._config.title : this._config.name)
      : entityFriendlyName;

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

    // 7. Dial Calculations & Arc Positioning (Strict Clamping to lowest/highest tickmarks)
    const minTemp = attrs.min_temp !== undefined ? attrs.min_temp : 7;
    const maxTemp = attrs.max_temp !== undefined ? attrs.max_temp : 35;
    
    let targetPct = 0.5;
    if (typeof targetTemp === 'number' && maxTemp > minTemp) {
      targetPct = Math.max(0, Math.min(1, (targetTemp - minTemp) / (maxTemp - minTemp)));
    } else {
      targetPct = 0.0;
    }

    const handleAngleDeg = 150 + targetPct * 240;
    const handleRad = (handleAngleDeg * Math.PI) / 180;
    const handleX = 120 + 100 * Math.cos(handleRad);
    const handleY = 120 + 100 * Math.sin(handleRad);

    if (dialHandle) {
      dialHandle.setAttribute('cx', handleX.toFixed(2));
      dialHandle.setAttribute('cy', handleY.toFixed(2));
    }

    // Progress arc: solid-color segments strictly between lowest (150°) and highest (390°) tickmarks
    this._renderProgress(targetPct, mode);

    // Handle / pin fill set as attributes so they never depend on CSS paint resolution
    if (dialHandle) dialHandle.setAttribute('fill', ClimateCard._modeColor(mode, targetPct));

    // Current Temp Pin Positioning
    let currentPct = 0.5;
    if (typeof currentTemp === 'number' && maxTemp > minTemp) {
      currentPct = Math.max(0, Math.min(1, (currentTemp - minTemp) / (maxTemp - minTemp)));
    }
    const pinAngleDeg = 150 + currentPct * 240;
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
    const modeBtns = root.querySelectorAll('.mode-btn');
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

/**
 * Home Assistant Lovelace Card Visual Editor Component
 */
class ClimateCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._rendered) {
      this.render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this.render();
    } else {
      this._updateSelectOptions();
    }
  }

  _updateSelectOptions() {
    if (!this._hass || !this._hass.states || !this.shadowRoot) return;
    
    // Prevent DOM updates while user is interacting with any editor input or dropdown
    const activeEl = this.shadowRoot.activeElement;
    if (activeEl) return;

    const climateOptions = Object.keys(this._hass.states)
      .filter(id => id.startsWith('climate.'))
      .sort();
    const sensorOptions = Object.keys(this._hass.states)
      .filter(id => id.startsWith('sensor.'))
      .sort();

    const entitySelect = this.shadowRoot.querySelector('#editorEntitySelect');
    const heatingSelect = this.shadowRoot.querySelector('#editorHeatingSelect');
    const coolingSelect = this.shadowRoot.querySelector('#editorCoolingSelect');

    const refreshSelect = (selectEl, options, currentVal) => {
      if (!selectEl) return;
      const currentSelected = selectEl.value || currentVal;
      let html = '<option value="">-- Select entity from Home Assistant --</option>';
      options.forEach(id => {
        const friendlyName = (this._hass.states[id].attributes && this._hass.states[id].attributes.friendly_name) || id;
        const isSelected = id === currentSelected ? 'selected' : '';
        html += `<option value="${id}" ${isSelected}>${friendlyName} (${id})</option>`;
      });
      if (selectEl.innerHTML !== html) {
        selectEl.innerHTML = html;
        selectEl.value = currentSelected;
      }
    };

    refreshSelect(entitySelect, climateOptions, this._config.entity);
    refreshSelect(heatingSelect, sensorOptions, this._config.heating_demand_entity);
    refreshSelect(coolingSelect, sensorOptions, this._config.cooling_demand_entity);
  }

  render() {
    if (!this._config) return;
    this._rendered = true;

    const title = this._config.title !== undefined ? this._config.title : (this._config.name || '');
    const entity = this._config.entity || '';
    const heatingEntity = this._config.heating_demand_entity || '';
    const coolingEntity = this._config.cooling_demand_entity || '';

    let defaultTitlePlaceholder = 'Leave blank to use entity name';
    if (this._hass && entity && this._hass.states[entity]) {
      const entityObj = this._hass.states[entity];
      if (entityObj.attributes && entityObj.attributes.friendly_name) {
        defaultTitlePlaceholder = `Default: ${entityObj.attributes.friendly_name}`;
      }
    }

    let climateOptions = [];
    let sensorOptions = [];

    if (this._hass && this._hass.states) {
      climateOptions = Object.keys(this._hass.states)
        .filter(id => id.startsWith('climate.'))
        .sort();
      sensorOptions = Object.keys(this._hass.states)
        .filter(id => id.startsWith('sensor.'))
        .sort();
    }

    const renderSelectOptions = (options, selectedVal) => {
      let html = '<option value="">-- Select entity from Home Assistant --</option>';
      options.forEach(id => {
        const friendlyName = (this._hass.states[id].attributes && this._hass.states[id].attributes.friendly_name) || id;
        const isSelected = id === selectedVal ? 'selected' : '';
        html += `<option value="${id}" ${isSelected}>${friendlyName} (${id})</option>`;
      });
      return html;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .climate-card-editor {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          padding: 0.5rem 0;
          font-family: inherit;
          color: var(--primary-text-color, #ffffff);
        }
        .editor-row {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .editor-label {
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--secondary-text-color, #94a3b8);
        }
        .editor-input, .editor-select {
          width: 100%;
          box-sizing: border-box;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          border: 1px solid var(--card-border-color, rgba(255, 255, 255, 0.15));
          background: var(--card-background-color, rgba(15, 23, 42, 0.6));
          color: var(--primary-text-color, #f8fafc);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .editor-input:focus, .editor-select:focus {
          border-color: var(--primary-color, #38bdf8);
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
        }
        .editor-select option {
          background: #0f172a;
          color: #f8fafc;
        }
        .editor-hint {
          font-size: 0.75rem;
          color: var(--secondary-text-color, #64748b);
          margin-top: 0.1rem;
        }
      </style>
      <div class="climate-card-editor">
        <div class="editor-row">
          <label class="editor-label" for="editorTitleInput">Card Title</label>
          <input type="text" class="editor-input" id="editorTitleInput" value="${title}" placeholder="${defaultTitlePlaceholder}" />
          <span class="editor-hint">Custom header title (leave blank to use entity friendly name by default)</span>
        </div>

        <div class="editor-row">
          <label class="editor-label" for="editorEntityInput">Thermostat Entity (Climate)</label>
          ${climateOptions.length > 0 ? `
            <select class="editor-select" id="editorEntitySelect">
              ${renderSelectOptions(climateOptions, entity)}
            </select>
          ` : ''}
          <input type="text" class="editor-input" id="editorEntityInput" value="${entity}" placeholder="climate.first_floor" />
          <span class="editor-hint">Main Home Assistant climate entity to control</span>
        </div>

        <div class="editor-row">
          <label class="editor-label" for="editorHeatingInput">Heating Demand Sensor Entity (0 - 100%)</label>
          ${sensorOptions.length > 0 ? `
            <select class="editor-select" id="editorHeatingSelect">
              ${renderSelectOptions(sensorOptions, heatingEntity)}
            </select>
          ` : ''}
          <input type="text" class="editor-input" id="editorHeatingInput" value="${heatingEntity}" placeholder="sensor.first_floor_outdoor_heat_pump_demand" />
          <span class="editor-hint">Sensor measuring outdoor heat pump heating demand percentage</span>
        </div>

        <div class="editor-row">
          <label class="editor-label" for="editorCoolingInput">Cooling Demand Sensor Entity (0 - 100%)</label>
          ${sensorOptions.length > 0 ? `
            <select class="editor-select" id="editorCoolingSelect">
              ${renderSelectOptions(sensorOptions, coolingEntity)}
            </select>
          ` : ''}
          <input type="text" class="editor-input" id="editorCoolingInput" value="${coolingEntity}" placeholder="sensor.first_floor_outdoor_cooling_demand" />
          <span class="editor-hint">Sensor measuring outdoor cooling demand percentage</span>
        </div>
      </div>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const root = this.shadowRoot;
    if (!root) return;
    const titleInput = root.querySelector('#editorTitleInput');
    const entityInput = root.querySelector('#editorEntityInput');
    const entitySelect = root.querySelector('#editorEntitySelect');
    const heatingInput = root.querySelector('#editorHeatingInput');
    const heatingSelect = root.querySelector('#editorHeatingSelect');
    const coolingInput = root.querySelector('#editorCoolingInput');
    const coolingSelect = root.querySelector('#editorCoolingSelect');

    const updateConfig = (key, val) => {
      this._config = {
        ...this._config,
        [key]: val
      };
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      }));
    };

    if (titleInput) {
      titleInput.addEventListener('input', (e) => updateConfig('title', e.target.value));
    }
    if (entityInput) {
      entityInput.addEventListener('input', (e) => updateConfig('entity', e.target.value));
    }
    if (entitySelect) {
      entitySelect.addEventListener('change', (e) => {
        if (entityInput) entityInput.value = e.target.value;
        updateConfig('entity', e.target.value);
      });
    }
    if (heatingInput) {
      heatingInput.addEventListener('input', (e) => updateConfig('heating_demand_entity', e.target.value));
    }
    if (heatingSelect) {
      heatingSelect.addEventListener('change', (e) => {
        if (heatingInput) heatingInput.value = e.target.value;
        updateConfig('heating_demand_entity', e.target.value);
      });
    }
    if (coolingInput) {
      coolingInput.addEventListener('input', (e) => updateConfig('cooling_demand_entity', e.target.value));
    }
    if (coolingSelect) {
      coolingSelect.addEventListener('change', (e) => {
        if (coolingInput) coolingInput.value = e.target.value;
        updateConfig('cooling_demand_entity', e.target.value);
      });
    }
  }
}

if (!customElements.get('climate-card-editor')) {
  customElements.define('climate-card-editor', ClimateCardEditor);
}

// Home Assistant Lovelace Card Picker Registration
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'climate-card',
  name: 'Custom Climate Control Card',
  description: 'Clean climate card with centered title, dial humidity, setpoint retry verification, and visual settings editor.',
  preview: true
});
