# Home Assistant Custom Climate Control Card (`custom:climate-card`)

A modern, sleek custom Lovelace thermostat card designed for Home Assistant with interactive radial dial temperature setpoint adjustment, clean entity headers, outdoor demand visualization, dynamic mode colors, and automatic light/dark theme adaptation.

---

## ✨ Key Features

- 🌡️ **Interactive Thermostat Dial**:
  - Drag or tap along the radial dial to adjust target temperature setpoints continuously.
  - 28 tick marks with target indicator pin and current room temperature pin.
  - Constant-size slider handle dot with zero jitter during movement.
- ➕➖ **Spacious Touch Controls**:
  - Oversized, high-contrast `-` and `+` setpoint adjustment buttons (`54px × 54px`) positioned above the demand bar for effortless operation on mobile and touch displays.
- 🎨 **Dynamic Mode Color Themes**:
  - 🔥 **Heat Mode**: Warm amber/orange accent (`#ff9800`). Icon: MDI Fire flame.
  - ❄️ **Cool Mode**: Cool cyan/blue accent (`#00bcd4`). Icon: Snowflake.
  - ⭕ **Off Mode**: Translucent slate gray accent (`#78909c`). Icon: Power button.
- 💧 **Centered Climate Readouts**:
  - Display centered friendly name in the header (no technical entity IDs exposed).
  - Centered room humidity readout (`💧 XX%`) inside the dial below current temperature.
- 📊 **Dual System Demand Gauge**:
  - Outdoor system demand bar (0% to 100%) positioned below setpoint controls.
  - Automatically toggles between heating demand sensor (`heating_demand_entity`) and cooling demand sensor (`cooling_demand_entity`) depending on active HVAC mode.
- 🌓 **Automatic Light & Dark Mode Support**:
  - Seamlessly integrates with Home Assistant theme variables and standard CSS `prefers-color-scheme`.
- 🌐 **Auto Temperature Unit Detection**:
  - Automatically formats values according to Home Assistant configuration (`°C` or `°F`).

---

## 🛠️ Installation in Home Assistant

### Option A: Using Home Assistant MCP
If using Home Assistant MCP tools, register the resource directly:
- **URL**: `/local/climate-card.js`
- **Resource Type**: `module`

### Option B: Manual Installation
1. Copy `climate-card.js` into your Home Assistant configuration directory under `www/`:
   ```bash
   cp climate-card.js /config/www/climate-card.js
   ```
2. In Home Assistant, navigate to **Settings** ➔ **Dashboards** ➔ **3 dots menu (top right)** ➔ **Resources**.
3. Click **Add Resource**:
   - **URL**: `/local/climate-card.js`
   - **Resource Type**: `JavaScript Module`

---

## 📋 Lovelace YAML Configuration

Add the card to any dashboard view via the UI Card Picker ("Custom: Climate Card") or directly in YAML:

### Basic Configuration
```yaml
type: custom:climate-card
entity: climate.first_floor
```

### Full Configuration (Recommended)
```yaml
type: custom:climate-card
entity: climate.first_floor
heating_demand_entity: sensor.first_floor_outdoor_heat_pump_demand
cooling_demand_entity: sensor.first_floor_outdoor_cooling_demand
```

### Configuration Parameters

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `entity` | `string` | **Required** | The target Home Assistant `climate` entity ID (e.g. `climate.first_floor`). |
| `heating_demand_entity` | `string` | *Optional* | Sensor entity ID for heat pump heating demand percentage (0–100%). |
| `cooling_demand_entity` | `string` | *Optional* | Sensor entity ID for outdoor cooling demand percentage (0–100%). |
| `humidity_entity` | `string` | *Optional* | Custom humidity sensor ID (if not using `attributes.current_humidity` from climate entity). |

---

## 🧪 Local Preview & Development Simulator

You can preview and test the card locally without connecting to Home Assistant:

1. Launch a local HTTP server in the repository folder:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000` in your web browser.
3. Use the interactive **Entity State Simulator** to toggle modes (`heat`, `cool`, `off`), change current/target temperatures, adjust outdoor demand levels, and test light/dark themes in real time.
