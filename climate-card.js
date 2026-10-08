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
 * - Embedded CSS styles for standalone Home Assistant rendering
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
    --mode-heat-gradient: linear-gradient(to right, #ff7043, #7f1d1d);
    --mode-heat-bg: rgba(255, 112, 67, 0.15);
    --mode-heat-border: rgba(255, 112, 67, 0.4);

    --mode-cool-color: #38bdf8;
    --mode-cool-gradient: linear-gradient(to right, #1e40af, #38bdf8);
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
`;