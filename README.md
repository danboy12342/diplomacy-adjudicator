
# Diplomacy Adjudicator

An interactive web app to help play the board game Diplomacy in person, providing a modern, automated order adjudicator and map interface.
## Try It Out

[**Use The Diplomacy Adjudicator**](https://diplomacy-adjudicator.onrender.com)



## Features

- **Interactive Map UI**: Clickable SVG map for unit selection, order entry, and visual feedback.
- **Order Entry**: Supports all standard Diplomacy orders (Move, Hold, Support, Convoy, Retreat, Build, Disband).
- **Automated Adjudication**: Processes all orders and resolves moves, supports, bounces, retreats, and adjustments per Diplomacy rules.
- **Multi-country Support**: Switch between countries to enter orders for each power.
- **Self-hosted**: Runs locally with no external dependencies beyond Node.js.
- **State Sync**: All game state is managed on the server and synced to the client.


## Usage

1. Select a country from the sidebar.
2. Click units on the map to select and enter orders (Move, Hold, Support, Convoy, etc).
3. Enter all orders for all countries, then click **Resolve** to adjudicate the turn.
4. The app will advance through Move, Retreat, and Adjustment phases automatically.
5. Use the **Reset** button to restart the game at any time.

## Project Structure

- `src/` — React frontend (App, map, UI logic)
- `server.js` — Node.js/Express backend (game state, adjudication, API)
- `data.js` — Map, adjacency, and initial setup data
- `index.html` — Main HTML entry point

## License

MIT
