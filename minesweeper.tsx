import * as React from 'react'
import * as ReactDOM from 'react-dom'

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

class CellGrid {
  private size  : { rows : number, cols : number }
  private cells : [CellValue, CellState][][]

  constructor (rows: number, cols: number) {
    this.size = { rows, cols }
    this.cells = CellGrid.init(rows, cols)
  }

  private clone (): CellGrid {
    const newGrid = new CellGrid(this.size.rows, this.size.cols)
    newGrid.cells = this.cells.slice()
    return newGrid
  }

  private mutateFrom (x: number, y: number): CellGrid {
    const newGrid       = this.clone()
    newGrid.cells[y]    = this.cells[y].slice()
    newGrid.cells[y][x] = this.cells[y][x].slice()
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

  forEach (fn: (x: number, y: number, value: CellValue, state: CellState) => void): void {
    for (let y = 0; y < this.size.rows; y++) {
      for (let x = 0; x < this.size.cols; x++) {
        fn.call(this, x, y, this.getCellValue(x, y), this.getCellState(x, y))
      }
    }
  }

  getRow (y: number): [CellValue, CellState][] {
    if (y >= this.size.rows || y < 0 || y % 1 !== 0) {
      return []
    }

    return this.cells.slice(y * this.size.cols, this.size.cols)
  }

  getRows (): [CellValue, CellState][][] {
    return this.cells
  }

  hasCell (x: number, y: number): boolean {
    if (x < 0 || x >= this.size.cols || y < 0 || y >= this.size.rows) {
      return false
    }

    return true
  }

  getCellValue (x: number, y: number): CellValue {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y][x][0]
  }

  setCellValue (x: number, y: number, value: CellValue): CellGrid {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    const newGrid = this.mutateFrom(x, y)
    newGrid.cells[y][x][0] = value
    return newGrid
  }

  getCellState (x: number, y: number): CellState {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y][x][1]
  }

  setCellState (x: number, y: number, state: CellState): CellGrid {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    const newGrid = this.mutateFrom(x, y)
    newGrid.cells[y][x][1] = state
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
    let grid = this
    this.forEach((x, y, value, state) => {
      if (value === CellValue.Bomb && state === CellState.Hidden) {
        grid = grid.setCellState(x, y, CellState.Exposed)
      } else if (value !== CellValue.Bomb && state === CellState.Flagged) {
        grid = grid.setCellState(x, y, CellState.Mistake)
      }
    })
    return grid
  }

  detonateBomb (x: number, y: number): CellGrid {
    return this.revealAllBombs()
               .setCellState(x, y, CellState.Boom)
  }

  revealCell (x: number, y: number): CellGrid {
      let grid      = this
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

  private static init (rows: number, cols: number): [CellValue, CellState][][] {
    const cells = [] as [CellValue, CellState][][]
    for (let y = 0; y < rows; y++) {
      cells[y] = []
      for (let x = 0; x < cols; x++) {
        cells[y][x] = [CellValue.Zero, CellState.Hidden]
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
  value   : CellValue
  state   : CellState
  onClick : () => void
}

class GameCell extends React.PureComponent<GameCellProps> {
  render () {
    const icon = pickIcon(this.props.value, this.props.state)
    const cb = () => { this.props.onClick() }
    return <td className={`game-cell game-cell-state-${icon}`} onClick={cb} />
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
  grid       : CellGrid
  foundBombs : number
  moves      : number
}

class MineSweeper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)

    let grid = new CellGrid(props.rows, props.cols)
    grid = addBombs(grid, props.totalBombs)
    grid = addValues(grid)

    this.state = {
      grid       : grid,
      foundBombs : 0,
      moves      : 0,
    }
  }

  handleCellClick (x: number, y: number): () => void {
    return (() => {
      this.setState({
        grid: this.state.grid.revealCell(x, y),
      })
    }).bind(this)
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
                      value={tuple[0]}
                      state={tuple[1]}
                      onClick={this.handleCellClick(x, y)} />
                  })}
                </GameRow>
              )
            })}
          </GameTable>
        </div>
        <div className="footer">
          <GameStat value={this.props.totalBombs - this.state.foundBombs} name="Bombs" />
          <GameStat value={this.state.moves} name="Moves" />
          <GameStat value="00:00" name="Time" />
        </div>
      </div>
    )
  }
}

function addBombs (grid: CellGrid, totalBombs: number): CellGrid {
  const newGrid = new CellGrid(grid.totalRows(), grid.totalCols())
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
  grid.forEach((x, y, value, state) => {
    if (grid.getCellValue(x, y) === CellValue.Bomb) {
      return
    }

    const neighborBombs = grid.countNeighborBombs(x, y)
    grid = grid.setCellValue(x, y, neighborBombs)
  })
  return grid
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

function parcel<T> (n: number, list: T[]): T[][] {
  if (n < 1) {
    throw new Error('expected n > 0')
  }

  const parcels = [] as T[][]
  const parcel = [] as T[];
  for (let i = 0; i < list.length; i++) {
    parcel.push(list[i])

    if (parcel.length >= n) {
      parcels.push(parcel)
      parcel = []
    }
  }

  return parcels
}

ReactDOM.render(<MineSweeper rows={10} cols={10} totalBombs={12} />, document.querySelector('main'))
