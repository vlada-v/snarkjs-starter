import React, { useState, useCallback } from "react";
import { parentPort } from "worker_threads";

function Cell(props) {
  const flip = () => {
    console.log(props);
    // isOpponent={false}
    if (props.isOpponent == false) {
      props.setCellValue(props.cellIndex, !props.value);
    } else {
      if (props.value == null) {
        props.clickAction(props.cellIndex);
      }
      // props.setCellValue(props.clickAction);
    }
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
        backgroundColor: props.isChosen
          ? "orange"
          : props.value === null
          ? "gray"
          : props.value
          ? "orangered"
          : "rgb(14, 34, 151)",
      }}
      onClick={flip}
    ></div>
  );
}

export function Ship(props) {
  return (
    <div
      style={{
        display: "inline-block",
        width: 25 * props.size,
        height: 25,
        borderColor: "rgb(148, 45, 14)",
        borderStyle: "solid",
        borderWidth: "2px",
        borderRadius: "15px",
        backgroundColor: "orangered",
        marginTop: 30,
      }}
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

  return result;
}

export function Board(props) {
  const setCellValue = (i, value) => {
    const newBoardState = props.boardState.slice();
    newBoardState[i] = value;
    props.setBoardState(newBoardState);
  };

  const clickAction = (i) => {
    props.setChosenShot(i);
  };

  const renderedCells = props.boardState.map((s, i) => (
    <Cell
      key={i}
      value={s}
      cellIndex={i}
      setCellValue={setCellValue}
      clickAction={clickAction}
      isOpponent={props.isOpponent}
      isChosen={props.chosenShot == i}
    />
  ));

  return <div>{renderTable(renderedCells, 10)}</div>;
}
