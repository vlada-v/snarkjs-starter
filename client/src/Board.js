import React, { useState, useCallback } from "react";
import { parentPort } from "worker_threads";

function getColor(props) {
  if (props.isChosen) {
    return "orange";
  }
  if (props.value == null) {
    return "rgb(170,170,170)";
  }
  if (props.isHit) {
    if (props.value == 0) {
      return "rgb(15, 15, 130)";
    } else if (props.value == 1) {
      return "rgb(180, 20, 20)";
    } else {
      return "rgb(25, 25, 25)";
    }
  } else {
    if (props.value == 0) {
      return "rgb(40, 40, 230)";
    } else {
      return "rgb(225,75,25)";
    }
  }
}

function Cell(props) {
  const flip = () => {
    console.log(props);
    // isOpponent={false}
    if (props.isOpponent == false) {
      props.setCellValue(props.cellIndex, props.value == 0 ? 1 : 0);
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
        backgroundColor: getColor(props),
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
      isHit={
        props.isOpponent
          ? props.boardState[i] != null
          : props.answeredFieldsState[i] == true
      }
    />
  ));

  return <div>{renderTable(renderedCells, 10)}</div>;
}
