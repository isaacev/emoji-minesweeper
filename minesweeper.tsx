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
    let icon = 'hidden'
    switch (this.props.state) {
      case CellState.Exposed:
        switch (this.props.value) {
          case CellValue.Bomb:
            icon = 'bomb'
            break
          default:
            icon = this.props.value.toString().toLowerCase()
        }
        break
      case CellState.Flagged:
        icon = 'flagged'
        break
      case CellState.Boom:
        icon = 'boom'
        break
    }

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
  foundBombs : number
  moves      : number
}

class MineSweeper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)

    const cellValues = new Array(props.rows * props.cols) as CellValue[]
    this.state = {
      cellValues,
      foundBombs : 0,
      moves      : 0,
    }
  }

  render () {
    return (
      <div className="minesweeper">
        <div className="game">

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

ReactDOM.render(<MineSweeper rows={5} cols={5} totalBombs={20} />, document.querySelector('main'))
