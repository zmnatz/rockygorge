import React from 'react';

export default class VideoItem extends React.Component {
  _handleClick = () => {
    this.props.onClick(this.props.video.id);

  }
  render () {
    return <div onClick={this._handleClick}>
      {this.props.video.opponent}
    </div>
  }
}