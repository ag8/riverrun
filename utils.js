function findEquidistantPoint(x, y, redIntersection, blueIntersection) {
    const steps = 1000;
    let closestPoint = null;
    let smallestDifference = Infinity;
    let radius = 0;

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
            radius = (distToRed + distToBlue) / 2; // Average of the two distances
        }

        if (difference < EPSILON) {
            drawEquidistantPoint(px, py);
            const intersections = drawAndFindIntersections(px, py, radius);
            updateDebug(`Equidistant point found at (${px.toFixed(2)}, ${py.toFixed(2)}), radius: ${radius.toFixed(2)}`);
            return intersections;
        }
    }

    // If we haven't found an exact match, use the closest point
    if (closestPoint) {
        drawEquidistantPoint(closestPoint.x, closestPoint.y);
        const intersections = drawAndFindIntersections(closestPoint.x, closestPoint.y, radius);
        updateDebug(`Approximate equidistant point found at (${closestPoint.x.toFixed(2)}, ${closestPoint.y.toFixed(2)}), radius: ${radius.toFixed(2)}`);
        return intersections;
    } else {
        updateDebug("No equidistant point found (this should not happen)");
        return null;
    }
}

function drawAndFindIntersections(x, y, radius) {
    const growthFactor = 1.01; // Grow the circle by 1%
    const grownRadius = radius * growthFactor;

    drawEquidistantCircle(x, y, radius);
    drawEquidistantCircle(x, y, grownRadius, 'rgba(0, 255, 0, 0.2)'); // Draw grown circle with less opacity

    const redIntersections = findCircleLineIntersections(x, y, grownRadius, redPoints);
    const blueIntersections = findCircleLineIntersections(x, y, grownRadius, bluePoints);

    // Draw intersection points
    redIntersections.forEach(point => drawPoint(point, 'red'));
    blueIntersections.forEach(point => drawPoint(point, 'blue'));

    const intersections = { red: redIntersections, blue: blueIntersections };
    const gatewayPairs = findGatewayPairsAndDrawBisectors(x, y, intersections);

    return { intersections, gatewayPairs };
}


function findCircleLineIntersections(cx, cy, r, linePoints) {
    let intersections = [];

    for (let i = 0; i < linePoints.length - 1; i++) {
        const x1 = linePoints[i].x - cx;
        const y1 = linePoints[i].y - cy;
        const x2 = linePoints[i + 1].x - cx;
        const y2 = linePoints[i + 1].y - cy;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dr = Math.sqrt(dx * dx + dy * dy);
        const D = x1 * y2 - x2 * y1;

        const discriminant = r * r * dr * dr - D * D;

        if (discriminant >= 0) {
            const sqrtDiscriminant = Math.sqrt(discriminant);
            const drSquared = dr * dr;

            const intersectionX1 = (D * dy + Math.sign(dy) * dx * sqrtDiscriminant) / drSquared + cx;
            const intersectionY1 = (-D * dx + Math.abs(dy) * sqrtDiscriminant) / drSquared + cy;

            const intersectionX2 = (D * dy - Math.sign(dy) * dx * sqrtDiscriminant) / drSquared + cx;
            const intersectionY2 = (-D * dx - Math.abs(dy) * sqrtDiscriminant) / drSquared + cy;

            // Check if intersections are on the line segment
            if (isPointOnLineSegment(intersectionX1, intersectionY1, linePoints[i], linePoints[i + 1])) {
                intersections.push({ x: intersectionX1, y: intersectionY1 });
            }
            if (isPointOnLineSegment(intersectionX2, intersectionY2, linePoints[i], linePoints[i + 1])) {
                intersections.push({ x: intersectionX2, y: intersectionY2 });
            }
        }
    }

    return intersections;
}

function isPointOnLineSegment(x, y, start, end) {
    const dxc = x - start.x;
    const dyc = y - start.y;
    const dxl = end.x - start.x;
    const dyl = end.y - start.y;

    const cross = dxc * dyl - dyc * dxl;

    if (Math.abs(cross) > EPSILON) {
        return false;
    }

    if (Math.abs(dxl) >= Math.abs(dyl)) {
        return dxl > 0 ?
            start.x <= x && x <= end.x :
            end.x <= x && x <= start.x;
    } else {
        return dyl > 0 ?
            start.y <= y && y <= end.y :
            end.y <= y && y <= start.y;
    }
}

function drawEquidistantCircle(x, y, radius, color = 'rgba(0, 255, 0, 0.5)') {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawPoint(point, color) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
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

function findGatewayPairsAndDrawBisectors(cx, cy, intersections) {
    const allIntersections = [...intersections.red.map(p => ({...p, color: 'red'})),
                              ...intersections.blue.map(p => ({...p, color: 'blue'}))];

    allIntersections.sort((a, b) => {
        const angleA = Math.atan2(a.y - cy, a.x - cx);
        const angleB = Math.atan2(b.y - cy, b.x - cx);
        return angleA - angleB;
    });

    const gatewayPairs = [];
    for (let i = 0; i < allIntersections.length; i++) {
        const current = allIntersections[i];
        const next = allIntersections[(i + 1) % allIntersections.length];
        if (current.color !== next.color) {
            gatewayPairs.push([current, next]);
        }
    }

    if (gatewayPairs.length === 2) {
        const [bisector1, bisector2] = calculateOptimalBisectors(cx, cy, gatewayPairs[0], gatewayPairs[1]);
        drawAngleBisector(cx, cy, bisector1);
        drawAngleBisector(cx, cy, bisector2);
    }

    return gatewayPairs;
}

function calculateOptimalBisectors(cx, cy, pair1, pair2) {
    const interiorBisector1 = calculateAngleBisector(cx, cy, pair1[0], pair1[1]);
    const exteriorBisector1 = interiorBisector1 + Math.PI;
    const interiorBisector2 = calculateAngleBisector(cx, cy, pair2[0], pair2[1]);
    const exteriorBisector2 = interiorBisector2 + Math.PI;

    const angleDiff1 = Math.abs(angleDifference(interiorBisector1, interiorBisector2));
    const angleDiff2 = Math.abs(angleDifference(interiorBisector1, exteriorBisector2));
    const angleDiff3 = Math.abs(angleDifference(exteriorBisector1, interiorBisector2));
    const angleDiff4 = Math.abs(angleDifference(exteriorBisector1, exteriorBisector2));

    const maxDiff = Math.max(angleDiff1, angleDiff2, angleDiff3, angleDiff4);

    if (maxDiff === angleDiff1) return [interiorBisector1, interiorBisector2];
    if (maxDiff === angleDiff2) return [interiorBisector1, exteriorBisector2];
    if (maxDiff === angleDiff3) return [exteriorBisector1, interiorBisector2];
    return [exteriorBisector1, exteriorBisector2];
}

function calculateAngleBisector(cx, cy, point1, point2) {
    const angle1 = Math.atan2(point1.y - cy, point1.x - cx);
    const angle2 = Math.atan2(point2.y - cy, point2.x - cx);
    return (angle1 + angle2) / 2;
}

function angleDifference(angle1, angle2) {
    let diff = angle2 - angle1;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    return diff;
}

function drawAngleBisector(cx, cy, angle) {
    const length = Math.max(canvas.width, canvas.height); // Ensure the line spans the entire canvas
    const endX = cx + length * Math.cos(angle);
    const endY = cy + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 2;
    ctx.stroke();
}
