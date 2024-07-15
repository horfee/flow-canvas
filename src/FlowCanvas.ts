import { html, css, LitElement, svg, PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';

@customElement("flow-element")
export class FlowElement extends LitElement {

  @property({type: Number, reflect: true})
  left = 0;

  @property({type: Number, reflect: true})
  top = 0;

  @property({type: Number, reflect: true})
  width= 120;

  @property({type: Number, reflect: true})
  height= 30;

  @property({type: String, reflect: true})
  label: string = "";

  @property({type: String, reflect: true})
  color = 0;

  @property({type: String, reflect: true})
  icon: string | undefined = undefined;

  @property({type: Number, reflect: true})
  nbSlots = 2;

  @property({type: String, reflect: true, attribute: "icon-anchor"})
  iconAnchor: "left"|"right" = "left";

  protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    const minHeight = 30;
    if ( _changedProperties.has("nbSlots") && _changedProperties.get("nbSlots") !== this.nbSlots ) {
      const lines = this.label.split("\n");
      const maxLengthLine = Math.max(...lines.map( (l) => l.length));
      this.height = Math.max(minHeight, lines.length * 24, this.nbSlots * 10 + (2*5));
    } 
    if ( _changedProperties.has("label") && _changedProperties.get("label") !== this.label ) {
      const minWidth = 100;
      const sizePerCharacter = 7.2;
      const iconWidth = 30;
      const iconMargin = 5;
      const slotSize = 10;
      const lines = this.label.split("\n");
      const maxLengthLine = Math.max(...lines.map( (l) => l.length));
      this.width = Math.max(minWidth, maxLengthLine * sizePerCharacter + iconWidth + iconMargin * 2 + slotSize);
      this.height = Math.max(minHeight, lines.length * 24, this.nbSlots * 10 + (2*5));
    }
  }

  private _onMouseDownOnNode(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent("mouse-down", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this
    }}));

  }

  private _onMouseUp(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent("mouse-up", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this
    }}));

  }

  private _onMouseDownOnPort(slotNumber: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if ( this.isInputSlot(slotNumber )) {
      return;
    }
    this.dispatchEvent(new CustomEvent("port-mouse-down", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this,
      slot: slotNumber
    }}));
  }

  private _onMouseUpOnPort(slotNumber: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if ( !this.isInputSlot(slotNumber )) {
      return;
    }
    this.dispatchEvent(new CustomEvent("port-mouse-up", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this,
      slot: slotNumber
    }}));
  }



  render() {
    const mustAlignIconLeft = this.iconAnchor === "left";
    const lines = this.label.split("\n");
    return svg`
    <g class="node" id="${this.id}" transform="translate(${this.left || 0},${this.top || 0})" @mousedown=${this._onMouseDownOnNode.bind(this)} @mouseup=${this._onMouseUp.bind(this)} >
      <rect class="node-rect " rx="5" ry="5" fill="#c0edc0" width="${this.width}" height="${this.height}"></rect>
      <g class="node-icon" x="0" y="0" c="${mustAlignIconLeft}" transform="translate(${mustAlignIconLeft ? 0 : this.width - 30},0)" style="pointer-events: none;">
        <image xlink:href="${this.icon}" class="node-icon" x="0" width="30" height="${this.height}" y="0" style=""></image>
        <path d="M ${mustAlignIconLeft ? 29.5 : 0.5 } 1 l 0 ${this.height - 2}" class="node-icon-shade-border"></path>
      </g>
      <g class="node-label" transform="translate(${ mustAlignIconLeft ? 38 : 8 },${(this.height - (lines.length * 24)) / 2 + 15})">
        ${lines.map( (label, index) => svg`
          <text class="node-label-text" x="0" y="${index * 24}">${label}</text>
        `)}
        
      </g>
      ${map(range(this.nbSlots), (i) => {
        const pos = this.getPositionForSlot(i);
      
        return svg`
        <g class="port" transform="translate(${pos.x - 5},${pos.y -5})" @mousedown=${this._onMouseDownOnPort.bind(this, i)} @mouseup=${this._onMouseUpOnPort.bind(this, i)} >
          <rect rx="3" ry="3" width="10" height="10" class="flow-port"></rect>
        </g>
        `
      })}
    </g>
    `;
  }

  isInputSlot(input: number) {
    return input == 0;
  }

  getPositionForSlot(input: number) {
    if ( this.isInputSlot(input) ) {
      return {x: 0, y: this.height / 2};
    } else {
      return {x: this.width, y: input * this.height / (this.nbSlots)}
    }
  }

  getGlobalPosition(input: number) {
    const res = this.getPositionForSlot(input);
    res.x += this.left;
    res.y += this.top;
    return res;
  }

  // getPositionForOutput(input: number) {
  //   return {x: this.left + this.width, y: this.top + (input +1) * this.height / (this.nbSlots)};
  // }
  
}

@customElement("flow-connector")
export class FlowConnector extends LitElement {

  @property({type: String, reflect: true})
  color = "";

  @property({type: String, reflect: true})
  predecessor = "";

  @property({type: Number, reflect: true})
  predecessorSlot = 0;

  @property({type: String, reflect: true})
  successor = "";

  @property({type: Number, reflect: true})
  successorSlot = 0;

}

@customElement("flow-canvas")
export class FlowCanvas extends LitElement {
  static styles = css`
    [hidden] {
      display: none;
    }
    
    :host {
      display: block;
      --background-color: white;
      --grid-color: lightgray;
      --node-border: red;
      --primary-font-size: 14px;
      --primary-font: "Helvetica Neue", Arial, Helvetica, sans-serif;
      font-size: var(--primary-font-size);
      font-family: var(--primary-font);
      width: fit-content;
      height: fit-content;
      box-sizing: border-box;
      border: 1px solid var(--grid-color);

    }

    :host(:not([showgrid])) g.grid {
      display: none;
    }


    svg {
      line-height: 20px;
      outline: none;
    }
    
    rect.background {
      fill: var(--background-color);
    }
    
    g.grid {
      stroke: var(--grid-color);
    }

    g.selected g.node > rect {
      stroke-width: 3;
    }

    g.node {
      stroke: var(--node-border);
      cursor: move;
      stroke-width: 1;
    }

    g text {
      stroke: black;
      stroke-width: 0px;
      dominant-baseline: middle;
      user-select: none;
    }

    div.toolbar {
      position: sticky;
      padding: 5px;
      top: 0px;
      left: 0px;
      width: fit-content;
      border: 1px solid lightgray;
      background: #AAAAAA50;
      border-radius: 5px;
      margin: 5px;
    }

  `;

  @property({ type: Number, reflect: true }) width = 8000;

  @property({ type: Number, reflect: true }) height = 8000;

  @property({ type: Number, reflect: true }) scale = 1;

  @property({ type: Number, reflect: true }) gridSize = 20;

  @property({ type: Boolean, reflect: true}) showGrid = true;

  connectedCallback(): void {
    super.connectedCallback();
  }

  private _onKeyPress(ev: Event) {
    const e = ev as KeyboardEvent;
    if ( e.key === "Delete" || e.key === "Backspace" ) {
      if (this.selectedElement !== undefined ) {
        const n = this.querySelector("#" + this.selectedElement);
        n!.remove();
        return;
      }
    }
    
  }

  @state()
  private nodes: Array<FlowElement> = [];

  @state()
  private connectors: Array<FlowConnector> = [];

  @state()
  private links: Array<FlowConnector> = [];

  private _handleSlotChange(e: Event) {
    let childNodes = [...(e.target! as any).assignedNodes({flatten: true})];
    const flowElements = childNodes.filter( (node) => node instanceof FlowElement && this.nodes.findIndex((v) => v.id == node.id) == -1) as Array<FlowElement>;
    const filteredNodes = this.nodes.filter( (node) => childNodes.find( (n1) => n1 instanceof FlowElement && node.id === n1.id) !== undefined);
    if ( filteredNodes.length != this.nodes.length ) {
      this.nodes = filteredNodes;
      this.requestUpdate("nodes");
    }
    if ( flowElements.length > 0 ) {
      flowElements.forEach( (element) => {
        
        element.addEventListener("mouse-up", (e: any) => {
          if ( this.draggingId === e.detail.node.id ) {
            this.selectedElement = e.detail.node.id;
          }
          e.preventDefault();
          e.stopPropagation();
          this.requestUpdate("selectedElement");
          
        });

        element.addEventListener("mouse-down", (e: any) => {
          this.isDraggingNode = true;
          this.draggingNode = e.detail.node;
          this.eX = e.detail.x;
          this.eY = e.detail.y;
          this.draggingId = this.draggingNode!.id;
          this.selectedElement = this.draggingId;
          this.requestUpdate("draggingId");
          
        });
        
        element.addEventListener("port-mouse-down", (e: any) => {
          this.isCreatingConnector = true;
          this.creatingConnectorSource = e.detail.node;
          this.creatingConnectorSourceSlot = e.detail.slot;
          this.creatingConnectorEndPoint = this.creatingConnectorSource!.getGlobalPosition(e.detail.slot);//.getPositionForOutput(e.detail.slot);
          this.requestUpdate("isCreatingConnector");
          console.log("Start creating output connector for slot 0");
        });

        element.addEventListener("port-mouse-up", (e: any) => {

          const selector = `flow-connector[predecessor="${this.creatingConnectorSource!.id}"][predecessorslot="${this.creatingConnectorSourceSlot}"][successor="${e.detail.node.id}"][successorslot="${e.detail.slot}"]`;
          const existingConnector = this.querySelector(selector);
          if ( existingConnector !== null ) {
            console.log("Alreayd exists");
            return;
          }
          this.isCreatingConnector = false;
          this.requestUpdate("isCreatingConnector");
          const cnx = document.createElement("flow-connector") as FlowConnector;

          let i = 0;
          do {
            cnx.id = "connector-" + i;
            i++;
          } while( this.querySelector("#" + cnx.id) !== null);
          cnx.predecessor = this.creatingConnectorSource!.id;
          cnx.successor = e.detail.node.id;
          cnx.predecessorSlot = this.creatingConnectorSourceSlot;
          cnx.successorSlot = e.detail.slot;
          this.appendChild(cnx);
          //this.creatingConnectorSourceSlot = e.detail.slot;
          console.log("Start creating output connector for slot 0");
        });
       
      });
      this.nodes.splice(-1,0, ...flowElements);
      this.requestUpdate("nodes");
    }
    

    const filteredConnectors = this.connectors.filter( (node) => childNodes.find( (n1) => n1 instanceof FlowConnector && node.id === n1.id) !== undefined);
    if ( filteredConnectors.length != this.connectors.length ) {
      this.connectors = filteredConnectors;
      this.requestUpdate("connectors");
    }
    const connectors = childNodes.filter( (node) => node instanceof FlowConnector && this.connectors.findIndex((v) => v.id == node.id) == -1) as Array<FlowConnector>;
    if ( connectors.length > 0 ) {
      this.connectors.splice(-1, 0, ...connectors);
      this.requestUpdate("connectors");
    }
    const nodesId = this.nodes.map( (n) => n.id);
    if ( this.connectors.find( (c) => nodesId.indexOf(c.predecessor) == -1 || nodesId.indexOf(c.successor) == -1) ) {
      this.connectors = this.connectors.filter( (c) => nodesId.indexOf(c.predecessor) !== -1 && nodesId.indexOf(c.successor) !== -1);
      this.requestUpdate("connectors");
    }
    
  }


  private isDraggingNode = false;
  private eX = 0;
  private eY = 0;
  private draggingId = "";
  private draggingNode : FlowElement | undefined;

  private isCreatingConnector = false;
  private creatingConnectorSource : FlowElement | undefined;
  private creatingConnectorSourceSlot : number = 0;
  private creatingConnectorEndPoint: {x: number, y: number} = {x:0,y:0};
  
  @state()
  private selectedElement: string | undefined;

  private _onMouseUp(e: Event) {
    if ( this.isDraggingNode ) {
      this.isDraggingNode = false;
      this.draggingId = "";
      this.draggingNode = undefined;
      this.requestUpdate("draggingId");
      this.requestUpdate("connectors");
    } else if ( this.isCreatingConnector ) {
      this.isCreatingConnector = false;
      this.creatingConnectorSource = undefined;
      this.requestUpdate("isCreatingConnector");
    }
  }

  private _onMouseMove(e: MouseEvent) {
    if ( this.isDraggingNode ) {
      this.draggingNode!.left += (e.clientX - this.eX) / this.scale;
      this.draggingNode!.top += (e.clientY - this.eY) / this.scale;
      this.eX = e.clientX;
      this.eY = e.clientY;
      this.requestUpdate("nodes");
    } else if ( this.isCreatingConnector ) {
      this.creatingConnectorEndPoint.x = e.offsetX / this.scale;
      this.creatingConnectorEndPoint.y = e.offsetY / this.scale;
      this.requestUpdate("creatingConnectorEndPoint");

    }
  }

  private resolveInputPosition(connector: FlowConnector) {
    const node = this.nodes.find( (node) => node.id === connector.successor);
    return node!.getGlobalPosition(0);//.getPositionForInput(0);
  }

  private resolveOutputPosition(connector: FlowConnector) {
    const node = this.nodes.find( (node) => node.id === connector.predecessor);
    return node!.getGlobalPosition(1);//.getPositionForOutput(0);
  }
  

  private _selectElement(event: MouseEvent) {
    let elt = (event.target! as any);
    if ( !(elt instanceof SVGPathElement)) {
      elt = ([...this.querySelectorAll("flow-element")] as FlowElement[]).filter( (element) => element.left <= event.offsetX && element.left + element.width >= event.offsetX && element.top <= event.offsetY && element.top + element.height >= event.offsetY)[0];
    }

    // elt = document.elementsFromPoint(event.offsetX, event.offsetY);
    // while (elt.id === "" && elt instanceof SVGGElement ) elt = elt.parentNode;
    this.selectedElement = elt?.id || null;
    this.requestUpdate("selectedElement");
    event.preventDefault();
  }


  private _computeworkingBoundaries() {
    const elements = [...this.querySelectorAll("flow-element")] as Array<FlowElement>;
    const dimensions = {left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0};
    // const final = {left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0};
    // for(const elt of elements) {
    //   final.left = Math.min(final.left, elt.left);
    //   final.top = Math.min(final.top, elt.top);
    //   final.right = Math.max(final.right, elt.left + elt.width);
    //   final.bottom = Math.max(final.bottom, elt.top + elt.height);
    // }
    
    const final = elements.reduce( (accumulator, current) => ({ 
      left: Math.min(accumulator.left, current.left), 
      top: Math.min(accumulator.top, current.top), 
      right: Math.max(accumulator.right, current.left + current.width), 
      bottom: Math.max(accumulator.bottom, current.top + current.height)}), dimensions);
      
    return final;
  }

  private _zoomOnFlow() {
    const boundaries = this._computeworkingBoundaries();
    const size = this.getBoundingClientRect();
    boundaries.left = Math.max(0, boundaries.left - 10);
    boundaries.top = Math.max(0, boundaries.top - 10);
    boundaries.right += 20;//Math.min(size.w, boundaries.right + 10);
    boundaries.bottom += 20;// = Math.max(0, boundaries.left - 10);
    console.log(boundaries);
    console.log(size);

    const ratioW = size.width / (boundaries.right - boundaries.left);
    const ratioH = size.height / (boundaries.bottom - boundaries.top);
    console.log("Ratio : " + ratioW + " / " + ratioH);
    this.scale = Math.min(ratioH, ratioW);
    this.scrollTo({
      top: boundaries.top,
      left: boundaries.left,
      behavior: "smooth"
    });
  }

  renderConnector(connectorId: string, color: string, start: {x: number, y: number}, end: {x: number, y: number}) {

    return svg`
      <path id="${connectorId}" 
            stroke="${this.selectedElement === connectorId ? "red" : color || "black"}" 
            stroke-width="3" 
            fill="transparent"
            @click=${this._selectElement} 
            d="M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 60} ${end.y} ${end.x-10} ${end.y} "
            marker-end="url(#arrow)" ></path>
    `;
  }

  render() {
    return html`
      <div style="position: relative; width: ${this.width}px; height: ${this.height}px;">
        <div style="position: absolute; pointer-events:none; width: 100%; height: 100%;">
          <div class="toolbar" style="pointer-events: all;">
            <button @click=${() => this.scale = Math.max(this.scale - 0.1, 0.1)}>-</button>
            <button @click=${() => this.scale = 1}> =</button>
            <button @click=${() => this.scale = Math.min(this.scale + 0.1, 2)}>+</button>
            <button @click=${ this._zoomOnFlow }>Zoom</button>
            <input type="range" min="1" max="20" .value="${this.scale * 10}" class="slider" id="myRange" @change=${ (e: Event) => this.scale = (e.target as any).value / 10.0}>
          </div>
        </div>
        <svg tabIndex="0" width="${this.width}" height="${this.height}" style="cursor: crosshair; touch-action: none;" @keyup=${this._onKeyPress} @mousemove=${this._onMouseMove} @mouseup=${this._onMouseUp} @click=${this._selectElement} >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="12"
              markerHeight="6"
              orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
          <g>
            <g transform="scale(${this.scale})">

              <rect class="background" width="${this.width}" height="${this.height}"/>
              <g class="grid">
                ${map(range(1 + (this.height / this.gridSize)),(i) => svg`<line class="grid-h" x1="0" x2="${this.width}" y1="${i * this.gridSize}" y2="${i * this.gridSize}"></line>`)}
                ${map(range(1 + (this.width / this.gridSize)),(i) => svg`<line class="grid-h" x1="${i * this.gridSize}" x2="${i * this.gridSize}" y1="0" y2="${this.height}"></line>`)}
              </g>
              <g>
                ${this.connectors.map( (connector) => this.renderConnector(connector.id, connector.color, this.resolveOutputPosition(connector), this.resolveInputPosition(connector)))}
              </g>
              <g>
                ${this.nodes.filter(n => n.id !== this.draggingId && n.id !== this.selectedElement).map( (node) => node.render())}
                ${this.draggingNode !== undefined ? this.draggingNode.render() : ''}
              </g>
              <g class="selected">
                ${this.selectedElement && this.nodes.findIndex((node) => node.id === this.selectedElement) >= 0 ? this.nodes.find((node) => node.id === this.selectedElement)!.render() : ""};
              </g>
              <g>
                ${ this.isCreatingConnector ? this.renderConnector("tmp", "red", this.creatingConnectorSource!.getGlobalPosition(this.creatingConnectorSourceSlot)/*getPositionForOutput(0)*/, this.creatingConnectorEndPoint ): ''}
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div hidden>
        <slot @slotchange=${this._handleSlotChange} >
        </slot>
      </div>
    `;
  }
}
  