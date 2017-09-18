(function (React,ReactDOM) {
'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var TIMER_INTERVAL_MS = 10;
var GameState;
(function (GameState) {
    GameState[GameState["Reset"] = 0] = "Reset";
    GameState[GameState["Playing"] = 1] = "Playing";
    GameState[GameState["Won"] = 2] = "Won";
    GameState[GameState["Lost"] = 3] = "Lost";
})(GameState || (GameState = {}));
var CellValue;
(function (CellValue) {
    CellValue[CellValue["Zero"] = 0] = "Zero";
    CellValue[CellValue["One"] = 1] = "One";
    CellValue[CellValue["Two"] = 2] = "Two";
    CellValue[CellValue["Three"] = 3] = "Three";
    CellValue[CellValue["Four"] = 4] = "Four";
    CellValue[CellValue["Five"] = 5] = "Five";
    CellValue[CellValue["Six"] = 6] = "Six";
    CellValue[CellValue["Seven"] = 7] = "Seven";
    CellValue[CellValue["Eight"] = 8] = "Eight";
    CellValue[CellValue["Bomb"] = 9] = "Bomb";
})(CellValue || (CellValue = {}));
var CellState;
(function (CellState) {
    CellState[CellState["Hidden"] = 0] = "Hidden";
    CellState[CellState["Exposed"] = 1] = "Exposed";
    CellState[CellState["Flagged"] = 2] = "Flagged";
    CellState[CellState["Mistake"] = 3] = "Mistake";
    CellState[CellState["Boom"] = 4] = "Boom";
})(CellState || (CellState = {}));
var CellGrid = /** @class */ (function () {
    function CellGrid(rows, cols) {
        this.size = { rows: rows, cols: cols };
        this.cells = CellGrid.init(rows, cols);
        this.flags = 0;
    }
    CellGrid.prototype.clone = function () {
        var newGrid = new CellGrid(this.size.rows, this.size.cols);
        newGrid.cells = this.cells.slice();
        newGrid.flags = this.flags;
        return newGrid;
    };
    CellGrid.prototype.mutateFrom = function (x, y) {
        var newGrid = this.clone();
        newGrid.cells[y] = this.cells[y].slice();
        newGrid.cells[y][x] = { value: this.cells[y][x].value, state: this.cells[y][x].state };
        return newGrid;
    };
    CellGrid.prototype.totalCells = function () {
        return this.cells.length;
    };
    CellGrid.prototype.totalRows = function () {
        return this.size.rows;
    };
    CellGrid.prototype.totalCols = function () {
        return this.size.cols;
    };
    CellGrid.prototype.totalFlags = function () {
        return this.flags;
    };
    CellGrid.prototype.incFlags = function () {
        var newGrid = this.clone();
        newGrid.flags++;
        return newGrid;
    };
    CellGrid.prototype.decFlags = function () {
        var newGrid = this.clone();
        newGrid.flags--;
        return newGrid;
    };
    CellGrid.prototype.forEach = function (fn) {
        for (var y = 0; y < this.size.rows; y++) {
            for (var x = 0; x < this.size.cols; x++) {
                fn.call(this, x, y, this.getCell(x, y));
            }
        }
    };
    CellGrid.prototype.reduce = function (fn, accum) {
        var _this = this;
        return this.getRows().reduce(function (accum, row, y) {
            return row.reduce(function (accum, cell, x) {
                return fn.call(_this, accum, x, y, _this.getCell(x, y));
            }, accum);
        }, accum);
    };
    CellGrid.prototype.getRow = function (y) {
        if (y >= this.size.rows || y < 0 || y % 1 !== 0) {
            return [];
        }
        return this.cells[y];
    };
    CellGrid.prototype.getRows = function () {
        return this.cells;
    };
    CellGrid.prototype.hasCell = function (x, y) {
        if (x < 0 || x >= this.size.cols || y < 0 || y >= this.size.rows) {
            return false;
        }
        return true;
    };
    CellGrid.prototype.getCell = function (x, y) {
        if (this.hasCell(x, y) === false) {
            throw new Error("no cell at " + x + "x" + y);
        }
        return this.cells[y][x];
    };
    CellGrid.prototype.getCellValue = function (x, y) {
        if (this.hasCell(x, y) === false) {
            throw new Error("no cell at " + x + "x" + y);
        }
        return this.cells[y][x].value;
    };
    CellGrid.prototype.setCellValue = function (x, y, value) {
        if (this.hasCell(x, y) === false) {
            throw new Error("no cell at " + x + "x" + y);
        }
        var newGrid = this.mutateFrom(x, y);
        newGrid.cells[y][x].value = value;
        return newGrid;
    };
    CellGrid.prototype.getCellState = function (x, y) {
        if (this.hasCell(x, y) === false) {
            throw new Error("no cell at " + x + "x" + y);
        }
        return this.cells[y][x].state;
    };
    CellGrid.prototype.setCellState = function (x, y, state) {
        if (this.hasCell(x, y) === false) {
            throw new Error("no cell at " + x + "x" + y);
        }
        var newGrid = this.mutateFrom(x, y);
        newGrid.cells[y][x].state = state;
        return newGrid;
    };
    CellGrid.prototype.getCellNeighbors = function (x, y) {
        var _this = this;
        return [
            { x: x + 0, y: y - 1 },
            { x: x + 0, y: y + 1 },
            { x: x + 1, y: y + 0 },
            { x: x - 1, y: y + 0 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y - 1 },
            { x: x + 1, y: y + 1 },
            { x: x - 1, y: y + 1 },
        ].filter(function (coord) {
            var legalX = (coord.x >= 0 && coord.x < _this.size.cols);
            var legalY = (coord.y >= 0 && coord.y < _this.size.rows);
            return legalX && legalY;
        });
    };
    CellGrid.prototype.countNeighborBombs = function (x, y) {
        var _this = this;
        var neighbors = this.getCellNeighbors(x, y);
        return neighbors.reduce(function (accum, coord) {
            var isBomb = _this.getCellValue(coord.x, coord.y) === CellValue.Bomb;
            return accum + (isBomb ? 1 : 0);
        }, 0);
    };
    CellGrid.prototype.revealAllBombs = function () {
        return this.reduce(function (grid, x, y, cell) {
            if (cell.value === CellValue.Bomb && cell.state == CellState.Hidden) {
                return grid.setCellState(x, y, CellState.Exposed);
            }
            else if (cell.value !== CellValue.Bomb && cell.state === CellState.Flagged) {
                return grid.setCellState(x, y, CellState.Mistake);
            }
            else {
                return grid;
            }
        }, this);
    };
    CellGrid.prototype.detonateBomb = function (x, y) {
        return this.revealAllBombs()
            .setCellState(x, y, CellState.Boom);
    };
    CellGrid.prototype.revealCell = function (x, y) {
        var grid = this;
        var value = grid.getCellValue(x, y);
        var state = grid.getCellState(x, y);
        var neighbors = grid.getCellNeighbors(x, y);
        if (state === CellState.Hidden) {
            if (value === CellValue.Bomb) {
                return grid.detonateBomb(x, y);
            }
            else {
                grid = grid.setCellState(x, y, CellState.Exposed);
            }
        }
        else {
            return grid;
        }
        if (value === CellValue.Zero) {
            neighbors.forEach(function (neighbor) {
                grid = grid.revealCell(neighbor.x, neighbor.y);
            });
        }
        return grid;
    };
    CellGrid.prototype.flagCell = function (x, y) {
        var grid = this;
        var state = grid.getCellState(x, y);
        if (state === CellState.Hidden) {
            return grid.setCellState(x, y, CellState.Flagged).incFlags();
        }
        else if (state === CellState.Flagged) {
            return grid.setCellState(x, y, CellState.Hidden).decFlags();
        }
        else {
            return grid;
        }
    };
    CellGrid.prototype.isGameOver = function () {
        var anyDetonated = this.reduce(function (anyDetonated, x, y, cell) {
            if (cell.state === CellState.Boom) {
                return true;
            }
            return anyDetonated;
        }, false);
        if (anyDetonated) {
            return true;
        }
        else {
            var allRevealed = this.reduce(function (allRevealed, x, y, cell) {
                if (cell.state === CellState.Hidden) {
                    return false;
                }
                return allRevealed;
            }, true);
            return allRevealed;
        }
    };
    CellGrid.prototype.isGameWon = function () {
        return this.reduce(function (isWon, x, y, cell) {
            if (cell.state === CellState.Hidden) {
                return false;
            }
            if (cell.value === CellValue.Bomb && cell.state !== CellState.Flagged) {
                return false;
            }
            return isWon;
        }, true);
    };
    CellGrid.init = function (rows, cols) {
        var cells = [];
        for (var y = 0; y < rows; y++) {
            cells[y] = [];
            for (var x = 0; x < cols; x++) {
                cells[y][x] = { value: CellValue.Zero, state: CellState.Hidden };
            }
        }
        return cells;
    };
    return CellGrid;
}());
var GameTable = /** @class */ (function (_super) {
    __extends(GameTable, _super);
    function GameTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GameTable.prototype.render = function () {
        return (React.createElement("table", { className: "game-table" },
            React.createElement("tbody", null, this.props.children)));
    };
    return GameTable;
}(React.PureComponent));
var GameRow = /** @class */ (function (_super) {
    __extends(GameRow, _super);
    function GameRow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GameRow.prototype.render = function () {
        return (React.createElement("tr", { className: "game-row" }, this.props.children));
    };
    return GameRow;
}(React.PureComponent));
var GameCell = /** @class */ (function (_super) {
    __extends(GameCell, _super);
    function GameCell() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GameCell.prototype.render = function () {
        var _this = this;
        var icon = pickIcon(this.props.value, this.props.state);
        var onClick = function (event) { _this.props.onClick(event); };
        var onRightClick = function (event) { _this.props.onRightClick(event); };
        return React.createElement("td", { className: "game-cell game-cell-state-" + icon, onClick: onClick, onContextMenu: onRightClick });
    };
    return GameCell;
}(React.PureComponent));
var GameStat = /** @class */ (function (_super) {
    __extends(GameStat, _super);
    function GameStat() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GameStat.prototype.render = function () {
        return (React.createElement("div", { className: "stat" },
            React.createElement("p", { className: "value" }, this.props.value),
            React.createElement("p", { className: "name" }, this.props.name)));
    };
    return GameStat;
}(React.PureComponent));
var MineSweeper = /** @class */ (function (_super) {
    __extends(MineSweeper, _super);
    function MineSweeper(props) {
        var _this = _super.call(this, props) || this;
        _this.timerClock = null;
        var grid = new CellGrid(props.rows, props.cols);
        grid = addBombs(grid, props.totalBombs);
        grid = addValues(grid);
        _this.state = {
            state: GameState.Reset,
            grid: grid,
            moves: 0,
            timer: 0
        };
        return _this;
    }
    MineSweeper.prototype.handleCellClick = function (x, y) {
        var _this = this;
        return (function (event) {
            event.preventDefault();
            _this.updateGame(_this.state.grid.revealCell(x, y));
        }).bind(this);
    };
    MineSweeper.prototype.handleCellRightClick = function (x, y) {
        var _this = this;
        return (function (event) {
            event.preventDefault();
            _this.updateGame(_this.state.grid.flagCell(x, y));
        }).bind(this);
    };
    MineSweeper.prototype.startGame = function () {
        this.setState({
            state: GameState.Playing,
            timer: 0
        });
        this.startClock();
    };
    MineSweeper.prototype.wonGame = function (grid) {
        this.setState({
            state: GameState.Won,
            grid: grid.revealAllBombs()
        });
        this.stopClock();
    };
    MineSweeper.prototype.lostGame = function (grid) {
        this.setState({
            state: GameState.Lost,
            grid: grid.revealAllBombs()
        });
        this.stopClock();
    };
    MineSweeper.prototype.startClock = function () {
        var _this = this;
        this.resetClock();
        this.timerClock = setInterval(function () {
            _this.setState({
                timer: _this.state.timer + TIMER_INTERVAL_MS
            });
        }, TIMER_INTERVAL_MS);
    };
    MineSweeper.prototype.resetClock = function () {
        this.stopClock();
        this.setState({
            timer: 0
        });
    };
    MineSweeper.prototype.stopClock = function () {
        if (this.timerClock !== null) {
            clearInterval(this.timerClock);
        }
        this.timerClock = null;
    };
    MineSweeper.prototype.splitTime = function (time) {
        time = Math.round(time);
        var chunks = [];
        while (time > 0) {
            var chunk = time % 100;
            chunks.push(chunk);
            time -= chunk;
            time /= 100;
        }
        return chunks;
    };
    MineSweeper.prototype.formatTime = function () {
        var time = this.state.timer;
        var chunks = this.splitTime(time / 10).map(function (chunk) {
            if (chunk < 10) {
                return '0' + chunk.toString();
            }
            else {
                return chunk.toString();
            }
        }).reverse();
        if (chunks.length === 0) {
            return '00:00';
        }
        else if (chunks.length === 1) {
            return '00:' + chunks[0];
        }
        else {
            return chunks.join(':');
        }
    };
    MineSweeper.prototype.updateGame = function (grid) {
        switch (this.state.state) {
            case GameState.Won:
            case GameState.Lost:
                return;
            case GameState.Reset:
                this.startGame();
                break;
        }
        this.setState({
            grid: grid,
            moves: this.state.moves + 1
        });
        if (grid.isGameOver()) {
            if (grid.isGameWon()) {
                this.wonGame(grid);
            }
            else {
                this.lostGame(grid);
            }
        }
    };
    MineSweeper.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", { className: "minesweeper" },
            React.createElement("div", { className: "game" },
                React.createElement(GameTable, null, this.state.grid.getRows().map(function (cells, y) {
                    return (React.createElement(GameRow, { key: y }, cells.map(function (tuple, x) {
                        return React.createElement(GameCell, { key: x, value: tuple.value, state: tuple.state, onClick: _this.handleCellClick(x, y), onRightClick: _this.handleCellRightClick(x, y) });
                    })));
                }))),
            React.createElement("div", { className: "footer" },
                React.createElement(GameStat, { value: this.state.grid.totalFlags(), name: "Bombs" }),
                React.createElement(GameStat, { value: this.state.moves, name: "Moves" }),
                React.createElement(GameStat, { value: this.formatTime(), name: "Time" }))));
    };
    return MineSweeper;
}(React.Component));
function addBombs(grid, totalBombs) {
    var newGrid = new CellGrid(grid.totalRows(), grid.totalCols());
    var remaining = totalBombs;
    var failedGuesses = 0;
    while (remaining > 0 && failedGuesses < 10) {
        var x = guessBetween(0, grid.totalCols());
        var y = guessBetween(0, grid.totalRows());
        if (newGrid.getCellValue(x, y) !== CellValue.Bomb) {
            newGrid = newGrid.setCellValue(x, y, CellValue.Bomb);
            remaining--;
            failedGuesses = 0;
        }
        else {
            failedGuesses++;
        }
    }
    return newGrid;
}
function guessBetween(low, high) {
    return Math.floor(Math.random() * (high - low)) + low;
}
function addValues(grid) {
    return grid.reduce(function (grid, x, y, cell) {
        if (cell.value === CellValue.Bomb) {
            return grid;
        }
        else {
            return grid.setCellValue(x, y, grid.countNeighborBombs(x, y));
        }
    }, grid);
}
function pickIcon(value, state) {
    switch (state) {
        case CellState.Exposed:
            switch (value) {
                case CellValue.Bomb:
                    return 'bomb';
                default:
                    return CellValue[value].toLowerCase();
            }
        case CellState.Flagged:
            return 'flagged';
        case CellState.Mistake:
            return 'mistake';
        case CellState.Boom:
            return 'boom';
        default:
            return 'hidden';
    }
}
ReactDOM.render(React.createElement(MineSweeper, { rows: 16, cols: 24, totalBombs: 20 }), document.querySelector('main'));

}(React,ReactDOM));
//# sourceMappingURL=minesweeper.js.map
