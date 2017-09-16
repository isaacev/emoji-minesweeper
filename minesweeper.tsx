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
  totalBombs : number
}

interface State {
  foundBombs : number
  moves      : number
}

class MineSweeper extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
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

ReactDOM.render(<MineSweeper totalBombs={10} />, document.querySelector('main'))
