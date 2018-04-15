import React from 'react';
import { Menu, Label } from 'semantic-ui-react';
import Youtube from 'react-youtube';

export default class VideoSelector extends React.Component {
  state = {};

  _handleGameSelect = (e, { name }) => {
    this.setState({activeGame: name});
  }

  render () {
    const {activeGame} = this.state;
    const {games} = this.props;
    let gameComponent;
    if (activeGame) {
      gameComponent = <Youtube videoId={activeGame}/>
    }
    // console.log(games);
    let gameItems = games.map(game => 
      <Menu.Item
        key={game.id} 
        name={game.id}
        active={activeGame === game.id} 
        onClick={this._handleGameSelect}
      >
        <Label>{game.home ? 'H' : 'A'}</Label>
        {game.division} {game.opponent}: {game.date}
      </Menu.Item>
    );
    return <div style={{display: 'flex'}}>
      <Menu vertical style={{minWidth: 300, flex: 1}}>
        <Menu.Item>
          {gameItems}
        </Menu.Item>
      </Menu>
      {gameComponent}
    </div>
  }
}