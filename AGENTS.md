# Repository Guidelines

## Project Structure & Module Organization

HUST ĐRL Helper is a Manifest V3 Chrome, Edge, and Firefox extension for the iCTSV conduct-score page. The root `manifest.json` declares the extension entry points and content-script load order.

- `src/core/` contains score calculation, rank targets, recommendations, and criteria metadata.
- `src/content/` captures iCTSV data and renders the floating panel using Shadow DOM.
- `src/background/background.js` handles extension messages and local storage. `src/popup/` contains the toolbar popup.
- `src/data/sample_data.js` provides fallback criteria data. `icons/` contains extension icons.
- `tests/roadmap.test.js` is versioned. Other local tests and `docs/` are ignored.

## Build, Test, and Development Commands

- Run `npm ci` to install dependencies from the lockfile.
- Run `npm test -- --runInBand` to run the local Jest suite.
- For browser development, enable Developer mode on the extensions page and select **Load unpacked** with the repository root. The browser loads the source directly. After an edit, reload the extension and refresh the iCTSV tab.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes in JavaScript, and semicolons. Match existing file names such as `drl_analyzer.js`, use camelCase for functions and variables, and use uppercase snake case for constants and message types. Keep user-facing copy in Vietnamese. Preserve manifest script ordering when changing shared browser globals. The repository has no configured formatter or linter.

## Testing Guidelines

Name Jest files `tests/<module>.test.js`. Use the default Node environment for scoring logic and `@jest-environment jsdom` for DOM tests. No coverage threshold is configured. For scoring changes, verify group caps and rank boundaries. For UI changes, check the popup and affected widget behavior on the iCTSV scoring page.

## Commit & Pull Request Guidelines

Follow the history's short, descriptive subjects with prefixes such as `feat:`, `fix:`, `docs:`, and `chore:`. In a pull request, summarize the change, list verification steps, link any related issue, and include a screenshot for visible UI changes. Use sample data in screenshots and fixtures to avoid exposing student information.
