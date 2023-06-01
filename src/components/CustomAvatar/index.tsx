import { AvatarComponent } from '@rainbow-me/rainbowkit';
import React from 'react'
import jazzicon from '@metamask/jazzicon'

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  var el = jazzicon(size, address)
  const div = document.createElement('div')
  div.appendChild(el)
  return <div dangerouslySetInnerHTML={{ __html: div.innerHTML }}></div>
};
export default CustomAvatar