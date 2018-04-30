import React, { Component } from 'react';
import VideoSelector from './components/Video/VideoSelector'
import './App.css';

const GAME_LIST = [
{
  id: 'VlafxgyCgAo',
  home: true,
  opponent: 'Norfolk',
  division: 'D1',
  date: '2017/11/04'
},
{
  id: 'hjoMgdYKBfg',
  home: false,
  division: 'D1',
  opponent: 'Washington Irish',
  date: '2018/04/07'
},{
  id: 'XLfcAQBggqY',
  home: true,
  division: 'D1',
  opponent: 'Potomac Exiles',
  date: '2018/04/14'
}, {
  id: '59u_nVriPVQ',
  home: false,
  division: 'D1',
  opponent: 'Norfolk',
  date: '2018/04/21'
}, {
  id: 'hw3DJsf6k4I',
  home: false,
  division: 'D2',
  opponent: 'Norfolk',
  date: '2018/04/21'
}, {
  id: 'm9afdBhTKDI',
  home: true,
  division: 'D1',
  opponent: 'Pittsburgh',
  date: '2018/04/28'
}, {
  id: 'uuaRHd6ZnIU',
  home: true,
  division: 'D2',
  opponent: 'Philly Whitemarsh',
  date: '2018/04/28'
}
];

class App extends Component {
  render() {
    return (
      <div className="App">
        <VideoSelector games={GAME_LIST}/>
      </div>
    );
  }
}

export default App;
