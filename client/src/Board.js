import React, { useState ,useCallback} from 'react';

// function Cell(props) {
//   console.log(props.colorBackground)
//   return (
//     <div
//       style={{
//         display: 'inline-block',
//         height: '20px',
//         width: '20px',
//         border: "1px solid black",
//         background: props.colorBackground,
//       }}
//       onClick={props.onClickFn}
//     >{props.innerNum}</div>
//   )
// }

// export function Board() {
//   const bgColor2 = "#ff22ff";
//   const bgColor1 = "#22ffff";
//   const count = 5;
//   let array = [];

//   for (let i = 0; i < count; i++) {
//     array.push(i);
//   }

//   let [cellColor, setColor] = useState(Array(25).fill(true));

//   const flipColor = (i) => {
//     cellColor[i]= !cellColor[i]
//     setColor(cellColor);
//     console.log(cellColor[i]);
//   }

//   let rowOfCells = array.map((elem, i) => {
//     return (
//       <Cell
//         onClickFn={() => flipColor(i)}
//         key={i}
//         innerNum={elem}
//         colorBackground={cellColor[i] ? bgColor1 : bgColor2}
//       />
//     )
//   })

//   return (
//     <div>
//       {rowOfCells}
//     </div>
//   )
// }

function Cell(props) {
  const flip = () => {
    console.log(props);
    props.setCellValue(props.cellIndex, !props.value)
  }

  return <div style={{
    display: "inline-block",
    width: "25px",
    height: "25px",
    backgroundColor: props.value? "red" : "blue"
  }}onClick={flip}>x</div>
}

function renderTable(array, width) {
  // console.log(array)
  let result = [];

  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
    if ((i + 1) % width === 0) {
      result.push(<br />)
    }
  }

  return <>{result}</>
}

// function makeBoard(width, height) {
//   let result = [];

//   for (let i = 0; i < width * height; i++) {
//     result.push(false);
//   }

//   return result;
// }

export function Board(props) {
  // const [boardState, setBoardState] = useState(makeBoard(5, 5))

  const setCellValue = (i, value) => {
    props.boardState[i] = value
    props.setBoardState([...props.boardState])
  }

  const renderedCells = props.boardState.map((s, i) => <Cell key={i} value={s} cellIndex={i} setCellValue={setCellValue}/>)

  return <div>{renderTable(renderedCells, 5)}</div>
}