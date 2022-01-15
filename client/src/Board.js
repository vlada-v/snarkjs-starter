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
      return "rgb(18, 42, 95)";
    } else if (props.value == 1) {
      return "rgb(170, 33, 9)";
    } else {
      return "rgb(90, 18, 5)";
    }
  } else {
    if (props.value == 0) {
      return "rgb(31, 76, 172)";
    } else {
      return "rgb(255, 76, 21)";
    }
  }
}

function Cell(props) {
  const flip = () => {
    if (props.isOpponent == false) {
      props.setCellValue(props.cellIndex, props.value == 0 ? 1 : 0);
    } else {
      if (props.value == null) {
        props.clickAction(props.cellIndex);
      }
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
        // filter: props.isShot ? "brightness(35%)" : "brightness(100%)",
        // backgroundColor: props.isChosen
        //   ? "orange"
        //   : props.value === null
        //   ? "gray"
        //   : props.value
        //   ? "orangered"
        //   : "rgb(14, 34, 151)",
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
        margin: 4,
      }}
    >
      {props.size}
    </div>
  );
}

export function Console() {
  return (
    <div
      style={{
        display: "inline-block",
        width: "20%",
        height: "100%",
        backgroundColor: "black",
        position: "fixed",
        top: 0,
        right: 0,
        // borderColor: "rgb(148, 45, 14)",
        // borderStyle: "solid",
        // borderWidth: "2px",
        // borderRadius: "15px",
        // backgroundColor: "orangered",
        // marginLeft: 30,
      }}
    ></div>
  );
}

function renderTable(array, width) {
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
      // isShot={!props.isOpponent && props.answeredFieldsState[i]}
    />
  ));

  return <div>{renderTable(renderedCells, 10)}</div>;
}
