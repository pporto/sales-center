"use strict";

function isFuseWelcomePage() {
  return window.location.href.startsWith(SALES_CENTER_ORIGIN_URL);
}

function createSalesCenterCard() {
  const template = document.createElement("template");
  template.innerHTML = SALES_CENTER_TILE_HTML;
  return template.content.firstElementChild;
}

function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }

  if (options.dataset) {
    for (const [name, value] of Object.entries(options.dataset)) {
      element.dataset[name] = value;
    }
  }

  for (const child of children) {
    element.appendChild(child);
  }

  return element;
}

function createSvgElement(tagName, attributes = {}, children = []) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  for (const child of children) {
    element.appendChild(child);
  }

  return element;
}

function createThemeToggleIcons() {
  const iconAttributes = {
    "aria-hidden": "true",
    fill: "none",
    height: "18",
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "2",
    viewBox: "0 0 24 24",
    width: "18",
  };

  return [
    createSvgElement("svg", {
      ...iconAttributes,
      class: "sc-theme-icon sc-theme-icon-moon",
    }, [
      createSvgElement("path", {
        d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
      }),
    ]),
    createSvgElement("svg", {
      ...iconAttributes,
      class: "sc-theme-icon sc-theme-icon-sun",
    }, [
      createSvgElement("circle", { cx: "12", cy: "12", r: "4" }),
      createSvgElement("line", { x1: "12", x2: "12", y1: "2", y2: "4" }),
      createSvgElement("line", { x1: "12", x2: "12", y1: "20", y2: "22" }),
      createSvgElement("line", { x1: "4.93", x2: "6.34", y1: "4.93", y2: "6.34" }),
      createSvgElement("line", { x1: "17.66", x2: "19.07", y1: "17.66", y2: "19.07" }),
      createSvgElement("line", { x1: "2", x2: "4", y1: "12", y2: "12" }),
      createSvgElement("line", { x1: "20", x2: "22", y1: "12", y2: "12" }),
      createSvgElement("line", { x1: "4.93", x2: "6.34", y1: "19.07", y2: "17.66" }),
      createSvgElement("line", { x1: "17.66", x2: "19.07", y1: "6.34", y2: "4.93" }),
    ]),
  ];
}

function createTableColumnsIcon() {
  return createSvgElement("svg", {
    "aria-hidden": "true",
    class: "sc-table-columns-icon",
    fill: "none",
    height: "18",
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "2",
    viewBox: "0 0 24 24",
    width: "18",
  }, [
    createSvgElement("rect", { height: "14", rx: "2", width: "18", x: "3", y: "5" }),
    createSvgElement("line", { x1: "9", x2: "9", y1: "5", y2: "19" }),
    createSvgElement("line", { x1: "15", x2: "15", y1: "5", y2: "19" }),
  ]);
}
