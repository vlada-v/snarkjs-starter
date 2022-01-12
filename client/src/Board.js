import React, { useState, useCallback } from "react";

function Cell(props) {
  const flip = () => {
    console.log(props);
    props.setCellValue(props.cellIndex, !props.value);
  };

  return (
    <div
      style={{
        display: "inline-block",
        width: "25px",
        height: "25px",
        borderColor: "black",
        borderStyle: "solid",
        borderWidth: "1px",
        backgroundColor:
          props.value === null ? "gray" : props.value ? "red" : "blue",
      }}
      onClick={flip}
    ></div>
  );
}

function renderTable(array, width) {
  // console.log(array)
  let result = [];

  for (let i = 0; i < array.length; i++) {
    result.push(array[i]);
    if ((i + 1) % width === 0) {
      result.push(<br key={"br" + i} />);
    }
  }

  return <>{result}</>;
}

export function Board(props) {
  const setCellValue = (i, value) => {
    const newBoardState = props.boardState.slice();
    newBoardState[i] = value;
    props.setBoardState(newBoardState);
  };

  const renderedCells = props.boardState.map((s, i) => (
    <Cell key={i} value={s} cellIndex={i} setCellValue={setCellValue} />
  ));

  return <div>{renderTable(renderedCells, 5)}</div>;
}
