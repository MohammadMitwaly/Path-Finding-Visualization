const columns = 50;
const rows = 50;
let grid = createArray(columns, rows);

let openSet = [];
let closedSet = [];
let path = [];
let startPoint, endPoint;

let pointWidth, pointHeight;

let resetButton;

class Point {
  constructor(f, g, h, i, j) {
    this.xIndex = i;
    this.yIndex = j;
    this.previousPoint;
    this.f = f;
    this.g = g;
    this.h = h;
    this.neighborPoints = [];
    // Set point to wall randomly
    this.isWall = random(1) < 0.25 ? true : false;
  }

  show(pointColor) {
    if (this.isWall) {
      fill(0);
      noStroke();
      ellipse(
        this.xIndex * pointHeight + pointHeight / 2,
        this.yIndex * pointWidth + pointWidth / 2,
        pointHeight / 2,
        pointWidth / 2
      );
    } else if (pointColor) {
      fill(pointColor);
      rect(
        this.xIndex * pointHeight,
        this.yIndex * pointWidth,
        pointHeight - 1,
        pointWidth - 1
      );
    }
  }

  addNeighbors(grid) {
    if (this.xIndex < rows - 1) {
      this.neighborPoints.push(grid[this.xIndex + 1][this.yIndex]);
    }
    if (this.xIndex > 0) {
      this.neighborPoints.push(grid[this.xIndex - 1][this.yIndex]);
    }
    if (this.yIndex < columns - 1) {
      this.neighborPoints.push(grid[this.xIndex][this.yIndex + 1]);
    }
    if (this.yIndex > 0) {
      this.neighborPoints.push(grid[this.xIndex][this.yIndex - 1]);
    }
    if (this.xIndex > 0 && this.yIndex > 0) {
      this.neighborPoints.push(grid[this.xIndex - 1][this.yIndex - 1]);
    }
    if (this.xIndex < rows - 1 && this.yIndex > 0) {
      this.neighborPoints.push(grid[this.xIndex + 1][this.yIndex - 1]);
    }
    if (this.xIndex < rows - 1 && this.yIndex < columns - 1) {
      this.neighborPoints.push(grid[this.xIndex + 1][this.yIndex + 1]);
    }
  }
}

function setup() {
  resetButton = createButton("Generate new path");
  resetButton.mousePressed(generateNewPath);
  // put setup code here
  createCanvas(600, 600);
  generateNewPath();
}

function draw() {
  if (openSet.length > 0) {
    // Continue search for path
    const indexLowestF = findLowestF(openSet);
    var currentPoint = openSet[indexLowestF];

    // We have reached the destination
    if (currentPoint === endPoint) {
      // No need to continue Looping
      noLoop();
      console.log("We have reached the destination");
    }

    openSet = removeElementFromArr(openSet, currentPoint);
    closedSet.push(currentPoint);
    const currentPointNeighbors = currentPoint.neighborPoints;
    currentPointNeighbors.forEach((neighbor) => {
      if (!closedSet.includes(neighbor) && !neighbor.isWall) {
        const tentativeG = currentPoint.g + 1;
        // We have already been here
        let isNewPath = false;
        if (openSet.includes(neighbor)) {
          // Se if this is closer
          if (tentativeG < neighbor.g) {
            neighbor.g = tentativeG;
            isNewPath = true;
          }
        } else {
          // This is the first time we have come here
          neighbor.g = tentativeG;
          openSet.push(neighbor);
          isNewPath = true;
        }
        // Only recalculate if this is a new path
        if (isNewPath) {
          neighbor.h = calculateHeuristicEuclidean(neighbor, endPoint);
          neighbor.f = neighbor.h + neighbor.g;
          neighbor.previousPoint = currentPoint;
        }
      }
    });
  } else {
    // No path has been found, or we are at the end-point
    console.log("We have no path.");
    noLoop();
    return;
  }
  background(255);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      grid[i][j].show();
    }
  }

  closedSet.forEach((point) => point.show(color(255, 0, 0, 75)));
  openSet.forEach((point) => point.show(color(0, 255, 0, 75)));

  // Back-track and save the path
  path = [];
  let tempPoint = currentPoint;
  path.push(tempPoint);
  while (tempPoint.previousPoint) {
    path.push(tempPoint.previousPoint);
    tempPoint = tempPoint.previousPoint;
  }
  // Drawing path as continuous line
  noFill();
  stroke(43, 45, 66);
  strokeWeight(pointHeight / 2);
  beginShape();
  // Drawing the path in its current state
  path.forEach((point) => {
    vertex(
      point.xIndex * pointHeight + pointHeight / 2,
      point.yIndex * pointWidth + pointWidth / 2
    );
  });
  endShape();
}

function generateNewPath() {
  pointWidth = width / columns;
  pointHeight = height / rows;
  grid = createArray(columns, rows);
  grid = initArray(grid, rows, columns);
  startPoint = grid[0][0];
  endPoint = grid[rows - 1][columns - 1];
  openSet = [];
  openSet.push(startPoint);
  closedSet = [];
  path = [];

  loop();
}

function createArray(length) {
  var arr = new Array(length || 0),
    i = length;

  if (arguments.length > 1) {
    var args = Array.prototype.slice.call(arguments, 1);
    while (i--) arr[length - 1 - i] = createArray.apply(this, args);
  }

  return arr;
}

const initArray = (grid, rows, columns) => {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      grid[i][j] = new Point(0, 0, 0, i, j);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }
  // Making sure the start and end points are not walls
  grid[0][0].isWall = false;
  grid[rows - 1][columns - 1].isWall = false;
  return grid;
};

const findLowestF = (openSet) => {
  let index = 0;
  openSet.forEach((point, i) => {
    index = point.f < openSet[index].f ? i : index;
  });
  return index;
};

const removeElementFromArr = (arr, element) => {
  return arr.filter((item) => item !== element);
};

// Calculate the Euclidean distance between two points, which will always  be shorter than the actual distance
const calculateHeuristicEuclidean = (pointA, pointB) => {
  return dist(pointA.xIndex, pointA.yIndex, pointB.xIndex, pointB.yIndex);
};

// Taxicab distance
const calculateHeuristicManhattan = (pointA, pointB) => {
  return (
    abs(pointA.xIndex - pointB.xIndex) + abs(pointA.yIndex - pointB.yIndex)
  );
};
