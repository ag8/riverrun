function findEquidistantPoint(x, y, redIntersection, blueIntersection) {
    const steps = 1000; // Increase precision
    let closestPoint = null;
    let smallestDifference = Infinity;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = redIntersection.x + t * (blueIntersection.x - redIntersection.x);
        const py = redIntersection.y + t * (blueIntersection.y - redIntersection.y);

        const distToRed = distanceToLine(px, py, redPoints);
        const distToBlue = distanceToLine(px, py, bluePoints);
        const difference = Math.abs(distToRed - distToBlue);

        if (difference < smallestDifference) {
            smallestDifference = difference;
            closestPoint = { x: px, y: py };
        }

        if (difference < EPSILON) {
            drawEquidistantPoint(px, py);
            updateDebug(`Equidistant point found at (${px.toFixed(2)}, ${py.toFixed(2)})`);
            return;
        }
    }

    // If we haven't found an exact match, use the closest point
    if (closestPoint) {
        drawEquidistantPoint(closestPoint.x, closestPoint.y);
        updateDebug(`Approximate equidistant point found at (${closestPoint.x.toFixed(2)}, ${closestPoint.y.toFixed(2)})`);
    } else {
        updateDebug("No equidistant point found (this should not happen)");
    }
}

function distanceToLine(x, y, linePoints) {
    let minDist = Infinity;
    for (let i = 0; i < linePoints.length - 1; i++) {
        const dist = distanceToSegment({x, y}, linePoints[i], linePoints[i + 1]);
        if (dist < minDist) minDist = dist;
    }
    return minDist;
}

function drawEquidistantPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'green';
    ctx.fill();
}

function findValidPoint(mouseX, mouseY) {
    const points = state === 'drawing_red' ? redPoints : bluePoints;
    const lastPoint = points[points.length - 1];
    const dx = mouseX - lastPoint.x;
    const dy = mouseY - lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < TOLERANCE) return null;

    const newX = lastPoint.x + (dx * TOLERANCE / distance);
    const newY = lastPoint.y + (dy * TOLERANCE / distance);

    const newPoint = {x: newX, y: newY};

    if (isValidPoint(newPoint)) {
        return newPoint;
    }

    return null;
}

function isValidPoint(point) {
    const currentPoints = state === 'drawing_red' ? redPoints : bluePoints;
    const otherPoints = state === 'drawing_red' ? bluePoints : redPoints;

    for (let i = 0; i < currentPoints.length - 1; i++) {
        const dist = distanceToSegment(point, currentPoints[i], currentPoints[i + 1]);
        if (dist < TOLERANCE) {
            return false;
        }
    }

    for (let i = 0; i < otherPoints.length - 1; i++) {
        const dist = distanceToSegment(point, otherPoints[i], otherPoints[i + 1]);
        if (dist < TOLERANCE) {
            return false;
        }
    }

    return true;
}

function distanceToSegment(p, v, w) {
    const l2 = distanceSquared(v, w);
    if (l2 === 0) return distance(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    };
    return distance(p, projection);
}

function distance(a, b) {
    return Math.sqrt(distanceSquared(a, b));
}

function distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

function finishDrawing(mouseY) {
    const points = state === 'drawing_red' ? redPoints : bluePoints;
    const lastPoint = points[points.length - 1];
    const rightEdgeY = lastPoint.y + (mouseY - lastPoint.y) * (canvas.width - lastPoint.x) / (canvas.width - lastPoint.x);

    for (let y = rightEdgeY; y >= 0 && y <= canvas.height; y += (rightEdgeY > canvas.height / 2 ? -1 : 1)) {
        const edgePoint = {x: canvas.width, y: y};
        if (isValidPoint(edgePoint)) {
            points.push(edgePoint);
            drawLines();
            updateDebug(`${state === 'drawing_red' ? 'Red' : 'Blue'} line finished at (${canvas.width}, ${y.toFixed(2)})`);
            if (state === 'drawing_red') {
                state = 'red_complete';
                actionButton.textContent = "Draw Blue Line";
            } else {
                state = 'blue_complete';
                actionButton.textContent = "Begin";
            }
            actionButton.disabled = false;
            return;
        }
    }

    updateDebug(`Could not find a valid point on the right edge for ${state === 'drawing_red' ? 'red' : 'blue'} line`);
}

function drawLines() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLine(redPoints, 'red');
    drawLine(bluePoints, 'blue');
}

function drawLine(points, color) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateDebug(message) {
    debugDiv.textContent = message + '\n' + debugDiv.textContent;
    if (debugDiv.textContent.split('\n').length > 30) {
        debugDiv.textContent = debugDiv.textContent.split('\n').slice(0, 30).join('\n');
    }
}