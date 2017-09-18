import * as React from 'react'
import * as ReactDOM from 'react-dom'

const TIMER_INTERVAL_MS = 10

enum GameState {
  Reset,
  Playing,
  Won,
  Lost,
}

enum CellValue {
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Bomb,
}

enum CellState {
  Hidden,
  Exposed,
  Flagged,
  Mistake,
  Boom,
}

type Cell = { value: CellValue, state: CellState }

class CellGrid {
  private size  : { rows : number, cols : number }
  private cells : Cell[][]
  private flags : number

  constructor (rows: number, cols: number) {
    this.size = { rows, cols }
    this.cells = CellGrid.init(rows, cols)
    this.flags = 0
  }

  private clone (): CellGrid {
    const newGrid = new CellGrid(this.size.rows, this.size.cols)
    newGrid.cells = this.cells.slice()
    newGrid.flags = this.flags
    return newGrid
  }

  private mutateFrom (x: number, y: number): CellGrid {
    const newGrid       = this.clone()
    newGrid.cells[y]    = this.cells[y].slice()
    newGrid.cells[y][x] = { value: this.cells[y][x].value, state: this.cells[y][x].state }
    return newGrid
  }

  totalCells (): number {
    return this.cells.length
  }

  totalRows (): number {
    return this.size.rows
  }

  totalCols (): number {
    return this.size.cols
  }

  totalFlags (): number {
    return this.flags
  }

  incFlags (): CellGrid {
    const newGrid = this.clone()
    newGrid.flags++
    return newGrid
  }

  decFlags (): CellGrid {
    const newGrid = this.clone()
    newGrid.flags--
    return newGrid
  }

  forEach (fn: (x: number, y: number, cell: Cell) => void): void {
    for (let y = 0; y < this.size.rows; y++) {
      for (let x = 0; x < this.size.cols; x++) {
        fn.call(this, x, y, this.getCell(x, y))
      }
    }
  }

  reduce<T> (fn: (accum: T, x: number, y: number, cell: Cell) => T, accum: T): T {
    return this.getRows().reduce((accum: T, row: Cell[], y: number): T => {
      return row.reduce((accum: T, cell: Cell, x: number): T => {
        return fn.call(this, accum, x, y, this.getCell(x, y))
      }, accum)
    }, accum)
  }

  getRow (y: number): Cell[] {
    if (y >= this.size.rows || y < 0 || y % 1 !== 0) {
      return []
    }

    return this.cells[y]
  }

  getRows (): Cell[][] {
    return this.cells
  }

  hasCell (x: number, y: number): boolean {
    if (x < 0 || x >= this.size.cols || y < 0 || y >= this.size.rows) {
      return false
    }

    return true
  }

  getCell (x: number, y: number): Cell {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y][x]
  }

  getCellValue (x: number, y: number): CellValue {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y][x].value
  }

  setCellValue (x: number, y: number, value: CellValue): CellGrid {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    const newGrid = this.mutateFrom(x, y)
    newGrid.cells[y][x].value = value
    return newGrid
  }

  getCellState (x: number, y: number): CellState {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y][x].state
  }

  setCellState (x: number, y: number, state: CellState): CellGrid {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    const newGrid = this.mutateFrom(x, y)
    newGrid.cells[y][x].state = state
    return newGrid
  }

  getCellNeighbors (x: number, y: number): { x: number, y: number }[] {
    return [
      { x: x + 0, y: y - 1 }, // n
      { x: x + 0, y: y + 1 }, // s
      { x: x + 1, y: y + 0 }, // e
      { x: x - 1, y: y + 0 }, // w
      { x: x + 1, y: y - 1 }, // ne
      { x: x - 1, y: y - 1 }, // nw
      { x: x + 1, y: y + 1 }, // se
      { x: x - 1, y: y + 1 }, // sw
    ].filter((coord) => {
      const legalX = (coord.x >= 0 && coord.x < this.size.cols)
      const legalY = (coord.y >= 0 && coord.y < this.size.rows)
      return legalX && legalY
    })
  }

  countNeighborBombs (x: number, y: number): number {
    const neighbors = this.getCellNeighbors(x, y)
    return neighbors.reduce((accum, coord) => {
      const isBomb = this.getCellValue(coord.x, coord.y) === CellValue.Bomb
      return accum + (isBomb ? 1 : 0)
    }, 0)
  }

  revealAllBombs (): CellGrid {
    return this.reduce<CellGrid>((grid, x, y, cell): CellGrid => {
      if (cell.value === CellValue.Bomb && cell.state == CellState.Hidden) {
        return grid.setCellState(x, y, CellState.Exposed)
      } else {
        return grid.setCellState(x, y, CellState.Mistake)
      }
    }, this)
  }

  detonateBomb (x: number, y: number): CellGrid {
    return this.revealAllBombs()
               .setCellState(x, y, CellState.Boom)
  }

  revealCell (x: number, y: number): CellGrid {
      let grid      = this as CellGrid
    const value     = grid.getCellValue(x, y)
    const state     = grid.getCellState(x, y)
    const neighbors = grid.getCellNeighbors(x, y)

    if (state === CellState.Hidden) {
      if (value === CellValue.Bomb) {
        return grid.detonateBomb(x, y)
      } else {
        grid = grid.setCellState(x, y, CellState.Exposed)
      }
    } else {
      return grid
    }

    if (value === CellValue.Zero) {
      neighbors.forEach((neighbor) => {
        grid = grid.revealCell(neighbor.x, neighbor.y)
      })
    }

    return grid
  }

  flagCell (x: number, y: number): CellGrid {
    const grid  = this
    const state = grid.getCellState(x, y)

    if (state === CellState.Hidden) {
      return grid.setCellState(x, y, CellState.Flagged).incFlags()
    } else if (state === CellState.Flagged) {
      return grid.setCellState(x, y, CellState.Hidden).decFlags()
    } else {
      return grid
    }
  }

  isGameOver (): boolean {
    const anyDetonated = this.reduce<boolean>((anyDetonated, x, y, cell): boolean => {
      if (cell.state === CellState.Boom) {
        return true
      }

      return anyDetonated
    }, false)

    if (anyDetonated) {
      return true
    } else {
      const allRevealed = this.reduce<boolean>((allRevealed, x, y, cell): boolean => {
        if (cell.state === CellState.Hidden) {
          return false
        }

        return allRevealed
      }, true)

      return allRevealed
    }
  }

  isGameWon (): boolean {
    return this.reduce<boolean>((isWon, x, y, cell): boolean => {
      if (cell.state === CellState.Hidden) {
        return false
      }

      if (cell.value === CellValue.Bomb && cell.state !== CellState.Flagged) {
        return false
      }

      return isWon
    }, true)
  }

  private static init (rows: number, cols: number): Cell[][] {
    const cells = [] as Cell[][]
    for (let y = 0; y < rows; y++) {
      cells[y] = []
      for (let x = 0; x < cols; x++) {
        cells[y][x] = { value: CellValue.Zero, state: CellState.Hidden }
      }
    }
    return cells
  }
}

class GameTable extends React.PureComponent<{}> {
  render () {
    return (
      <table className="game-table">
        <tbody>
          {this.props.children}
        </tbody>
      </table>
    )
  }
}

class GameRow extends React.PureComponent<{}> {
  render () {
    return(
      <tr className="game-row">
        {this.props.children}
      </tr>
    )
  }
}

interface GameCellProps {
  value        : CellValue
  state        : CellState
  onClick      : (event: React.MouseEvent<HTMLDivElement>) => void
  onRightClick : (event: React.MouseEvent<HTMLDivElement>) => void
}

class GameCell extends React.PureComponent<GameCellProps> {
  render () {
    const icon = pickIcon(this.props.value, this.props.state)
    const onClick = (event: React.MouseEvent<HTMLDivElement>) => { this.props.onClick(event) }
    const onRightClick = (event: React.MouseEvent<HTMLDivElement>) => { this.props.onRightClick(event) }
    return <td
      className={`game-cell game-cell-state-${icon}`}
      onClick={onClick}
      onContextMenu={onRightClick} />
  }
}

class GameStat extends React.PureComponent<{value: any, name: string}> {
  render () {
    return (
      <div className="stat">
        <p className="value">{this.props.value}</p>
        <p className="name">{this.props.name}</p>
      </div>
    )
  }
}

interface Props {
  rows       : number
  cols       : number
  totalBombs : number
}

interface State {
  state  : GameState
  grid   : CellGrid
  moves  : number
  timer  : number
}

class MineSweeper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)

    let grid = new CellGrid(props.rows, props.cols)
    grid = addBombs(grid, props.totalBombs)
    grid = addValues(grid)

    this.state = {
      state : GameState.Reset,
      grid  : grid,
      moves : 0,
      timer : 0,
    }
  }

  timerClock : number = null

  handleCellClick (x: number, y: number): (event: React.MouseEvent<HTMLDivElement>) => void {
    return ((event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      this.updateGame(this.state.grid.revealCell(x, y))
    }).bind(this)
  }

  handleCellRightClick (x: number, y: number): (event: React.MouseEvent<HTMLDivElement>) => void {
    return ((event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      this.updateGame(this.state.grid.flagCell(x, y))
    }).bind(this)
  }

  startGame (): void {
    this.setState({
      state : GameState.Playing,
      timer : 0,
    })

    this.startClock()
  }

  wonGame (grid: CellGrid): void {
    this.setState({
      state : GameState.Won,
      grid  : grid.revealAllBombs(),
    })

    this.stopClock()
  }

  lostGame (grid: CellGrid): void {
    this.setState({
      state : GameState.Lost,
      grid  : grid.revealAllBombs(),
    })

    this.stopClock()
  }

  startClock (): void {
    this.resetClock()
    this.timerClock = setInterval(() => {
      this.setState({
        timer : this.state.timer + TIMER_INTERVAL_MS,
      })
    }, TIMER_INTERVAL_MS)
  }

  resetClock (): void {
    this.stopClock()
    this.setState({
      timer : 0,
    })
  }

  stopClock (): void {
    if (this.timerClock !== null) {
      clearInterval(this.timerClock)
    }

    this.timerClock = null
  }

  splitTime (time: number): number[] {
    time = Math.round(time)
    const chunks = [] as number[]

    while (time > 0) {
      const chunk = time % 100
      chunks.push(chunk)
      time -= chunk
      time /= 100
    }

    return chunks
  }

  formatTime (): string {
    const time = this.state.timer
    const chunks = this.splitTime(time / 10).map((chunk) => {
      if (chunk < 10) {
        return '0' + chunk.toString()
      } else {
        return chunk.toString()
      }
    }).reverse()

    if (chunks.length === 0) {
      return '00:00'
    } else if (chunks.length === 1) {
      return '00:' + chunks[0]
    } else {
      return chunks.join(':')
    }
  }

  updateGame (grid: CellGrid): void {
    switch (this.state.state) {
      case GameState.Won:
      case GameState.Lost:
        return
      case GameState.Reset:
        this.setState({
          state : GameState.Playing,
        })
        break
    }

    if (grid.isGameOver()) {
      this.setState({
        state : grid.isGameWon() ? GameState.Won : GameState.Lost,
        grid  : grid,
        moves : this.state.moves + 1,
      })
    } else {
      this.setState({
        grid  : grid,
        moves : this.state.moves + 1,
      })
    }
  }

  render () {
    return (
      <div className="minesweeper">
        <div className="game">
          <GameTable>
            {this.state.grid.getRows().map((cells, y) => {
              return (
                <GameRow key={y}>
                  {cells.map((tuple, x) => {
                    return <GameCell
                      key={x}
                      value={tuple.value}
                      state={tuple.state}
                      onClick={this.handleCellClick(x, y)}
                      onRightClick={this.handleCellRightClick(x, y)} />
                  })}
                </GameRow>
              )
            })}
          </GameTable>
        </div>
        <div className="footer">
          <GameStat value={this.state.grid.totalFlags()} name="Bombs" />
          <GameStat value={this.state.moves} name="Moves" />
          <GameStat value={this.formatTime()} name="Time" />
        </div>
      </div>
    )
  }
}

function addBombs (grid: CellGrid, totalBombs: number): CellGrid {
  let newGrid = new CellGrid(grid.totalRows(), grid.totalCols())
  let remaining = totalBombs
  let failedGuesses = 0
  while (remaining > 0 && failedGuesses < 10) {
    const x = guessBetween(0, grid.totalCols())
    const y = guessBetween(0, grid.totalRows())

    if (newGrid.getCellValue(x, y) !== CellValue.Bomb) {
      newGrid = newGrid.setCellValue(x, y, CellValue.Bomb)
      remaining--
      failedGuesses = 0
    } else {
      failedGuesses++
    }
  }

  return newGrid
}

function guessBetween (low: number, high: number): number {
  return Math.floor(Math.random() * (high - low)) + low
}

function addValues (grid: CellGrid): CellGrid {
  return grid.reduce<CellGrid>((grid, x, y, cell): CellGrid => {
    if (cell.value === CellValue.Bomb) {
      return grid
    } else {
      return grid.setCellValue(x, y, grid.countNeighborBombs(x, y))
    }
  }, grid)
}

function pickIcon (value: CellValue, state: CellState): string {
  switch (state) {
    case CellState.Exposed:
      switch (value) {
        case CellValue.Bomb:
          return 'bomb'
        default:
          return CellValue[value].toLowerCase()
      }
    case CellState.Flagged:
      return 'flagged'
    case CellState.Mistake:
      return 'mistake'
    case CellState.Boom:
      return 'boom'
    default:
      return 'hidden'
  }
}

ReactDOM.render(<MineSweeper rows={16} cols={24} totalBombs={12} />, document.querySelector('main'))
