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
  Boom,
}

class CellGrid {
  private rows  : number
  private cols  : number
  private cells : [CellValue, CellState][]

  constructor (rows: number, cols: number) {
    this.rows  = rows
    this.cols  = cols
    this.cells = new Array(rows * cols) as [CellValue, CellState][]
    this.init()
  }

  totalRows (): number {
    return this.rows
  }

  totalCols (): number {
    return this.cols
  }

  getRow (y: number): [CellValue, CellState][] {
    if (y >= this.rows || y < 0 || y % 1 !== 0) {
      return []
    }

    return this.cells.slice(y * this.cols, this.cols)
  }

  getRows (): [CellValue, CellState][][] {
    return parcel<[CellValue, CellState]>(this.cols, this.cells)
  }

  hasCell (x: number, y: number): boolean {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
      return false
    }

    return true
  }

  getCell (x: number, y: number): [CellValue, CellState] {
    if (this.hasCell(x, y) === false) {
      throw new Error(`no cell at ${x}x${y}`)
    }

    return this.cells[y * this.cols + this.x]
  }

  private init (): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = [CellValue.Zero, CellState.Hidden]
    }
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

class GameCell extends React.PureComponent<{ value: CellValue, state: CellState, onClick: () => void }> {
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
    this.state = {
      grid       : new CellGrid(props.rows, props.cols),
      foundBombs : 0,
      moves      : 0,
    }
  }

  handleCellClick (row: number, col: number): () => void {
    return (() => {
      console.log(`clicked ${col}x${row}`)
    }).bind(this)
  }

  render () {
    const rows = this.state.grid.getRows().map((cells, y) => {
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
    })

    return (
      <div className="minesweeper">
        <div className="game">
          <GameTable>
            {rows}
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

function addBombs (cells: CellValue[], totalBombs: number) {
  let remaining = totalBombs
  let failedGuesses = 0
  while (remaining > 0 && failedGuesses < 10) {
    const guess = Math.floor(Math.random() * cells.length)

    if (cells[guess] !== CellValue.Bomb) {
      cells[guess] = CellValue.Bomb
      remaining--
      failedGuesses = 0
    } else {
      failedGuesses++
    }
  }
}

function addValues (cells: CellValue[], width: number) {
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === CellValue.Bomb) {
      continue
    }

    const x = i % width
    const y = Math.floor(i / width)
    const rowAbove = y > 0
    const rowBelow = i < (cells.length - width)
    const colLeft  = x > 0
    const colRight = x < (width - 1)

    let near = 0
    near += (rowAbove)             ? ((cells[i - width]     === CellValue.Bomb) ? 1 : 0) : 0 // n
    near += (rowBelow)             ? ((cells[i + width]     === CellValue.Bomb) ? 1 : 0) : 0 // s
    near += (colLeft)              ? ((cells[i - 1]         === CellValue.Bomb) ? 1 : 0) : 0 // w
    near += (colRight)             ? ((cells[i + 1]         === CellValue.Bomb) ? 1 : 0) : 0 // e
    near += (rowAbove && colLeft)  ? ((cells[i - width - 1] === CellValue.Bomb) ? 1 : 0) : 0 // nw
    near += (rowAbove && colRight) ? ((cells[i - width + 1] === CellValue.Bomb) ? 1 : 0) : 0 // ne
    near += (rowBelow && colLeft)  ? ((cells[i + width - 1] === CellValue.Bomb) ? 1 : 0) : 0 // sw
    near += (rowBelow && colRight) ? ((cells[i + width + 1] === CellValue.Bomb) ? 1 : 0) : 0 // se

    cells[i] = CellValue[near]
  }
}

function pickIcon (value: CellValue, state: CellState): string {
  switch (state) {
    case CellState.Exposed:
      switch (value) {
        case CellValue.Bomb:
          return 'bomb'
        default:
          return value.toString().toLowerCase()
      }
    case CellState.Flagged:
      return 'flagged'
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
