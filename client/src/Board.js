import React, { useState } from 'react';

function Cell(props) {
  console.log(props.onClickFn);
  return (
    <div
      style={{
        display: 'inline-block',
        height: '20px',
        width: '20px',
        border: "1px solid black"
      }}
      onClick={props.onClickFn}
    >{props.innerNum}</div>
  )
}

export function Board() {
  const bgColor1 = "#ff22ff";
  const bgColor2 = "#22ffff";

  let [count, setCount] = useState(1);

  const increment = () => {
    setCount(count + 1);
    console.log(count);
  }

  let array = [];
  for (let i = 0; i < count; i++) {
    array.push(i);
  }

  let rowOfCells = array.map((elem) => {
    return (
      <Cell
        onClickFn={increment}
        key={elem}
        innerNum={elem}
      ></Cell>
    )
  })

  return (
    <div>
      {rowOfCells}
    </div>
  )
}