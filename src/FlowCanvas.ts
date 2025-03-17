import { html, css, LitElement, svg, PropertyValueMap, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';
import { FlowElement, FlowConnector } from './FlowElements.js';
import './FlowElements.js';

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
      --node-border: darkgray;
      --primary-font-size: 14px;
      --highlighted-color: red;
      --fill-color: #c0edc0;
      --highlighted-fill-color: #c0edc0;
      --primary-font: "Helvetica Neue", Arial, Helvetica, sans-serif;
      font-size: var(--primary-font-size);
      font-family: var(--primary-font);
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

    g.selected g.node > rect,
    g.selected g.node > polygon,
    g.selected g.node > circle,
    g.selected g.node > polyline {
      stroke: var(--highlighted-color);
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

  @property({ type: Boolean, reflect: true}) deleteAllowed = false;


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
        
        element.addEventListener("double-click", (e: any) => {
          this.selectedElement = e.detail.node.id;
          e.preventDefault();
          e.stopPropagation();
          this.dispatchEvent(new CustomEvent("element-double-click", { detail: {
            id: this.selectedElement
          }}));
        });

        element.addEventListener("mouse-up", (e: any) => {
          if ( this.draggingId === e.detail.node.id ) {
            this.selectedElement = e.detail.node.id;
          }
          e.preventDefault();
          e.stopPropagation();

          this.draggingId = "";
          this.draggingNode = undefined;
          this.isDraggingNode = false;
          this.requestUpdate("draggingId");
          this.requestUpdate("selectedElement");
          
          this.dispatchEvent(new CustomEvent("value-changed", { detail: {
            id: this.selectedElement,
            left: e.detail.node.left,
            top: e.detail.node.top
          }}));
        });

        element.addEventListener("mouse-down", (e: any) => {
          this.isDraggingNode = true;
          this.draggingNode = e.detail.node;
          this.eX = e.detail.x;
          this.eY = e.detail.y;

          this.draggingId = this.draggingNode!.id;
          this.selectedElement = this.draggingId;
          this.requestUpdate("draggingId");
          this.requestUpdate("selectedElement");
          this.dispatchEvent(new CustomEvent("element-selected", {detail: {
            id: this.selectedElement
          }}));
          
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
          
          this.getNode(cnx.predecessor)?.dispatchEvent(new CustomEvent("connector-created", {detail: cnx}));
          this.getNode(cnx.successor)?.dispatchEvent(new CustomEvent("connector-created", {detail: cnx}));
          //this.creatingConnectorSourceSlot = e.detail.slot;
          this.dispatchEvent(new CustomEvent("connector-created", {detail:cnx, bubbles: true, composed: true}));

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
  
  @property({type: String, reflect: false})
  public selectedElement: string | undefined;

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
    } else {
      this.selectedElement = "";
      this.requestUpdate("selectedElement");
      this.dispatchEvent(new CustomEvent("element-selected", {detail: {
        id: this.selectedElement
      }}));
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

  private getNode(id: string): FlowElement|undefined {
    return this.nodes.find( (node) => node.id === id);
    
  }

  private resolveInputPosition(connector: FlowConnector) {
    const node = this.getNode(connector.successor);
    //const node = this.nodes.find( (node) => node.id === connector.successor);
    return node!.getGlobalPosition(connector.successorSlot);//.getPositionForInput(0);
  }

  private resolveOutputPosition(connector: FlowConnector) {
    //const node = this.nodes.find( (node) => node.id === connector.predecessor);
    const node = this.getNode(connector.predecessor);
    return node!.getGlobalPosition(connector.predecessorSlot);//.getPositionForOutput(0);
  }

  private resolveConnectorEndShouldBeVertical(connector: FlowConnector) {
    //const node = this.nodes.find( (node) => node.id === connector.successor);
    const node = this.getNode(connector.successor);
    return node!.slotConnectorShouldBeVertical(connector.successorSlot);
  }

  private resolveConnectorStartShouldBeVertical(connector: FlowConnector) {
    //const node = this.nodes.find( (node) => node.id === connector.predecessor);
    const node = this.getNode(connector.predecessor);
    return node!.slotConnectorShouldBeVertical(connector.predecessorSlot);
  }
  
  private get flowElements(): Array<FlowElement> {
    return [...this.children].filter( (elt) => elt instanceof FlowElement) as Array<FlowElement>;
  }

  private _selectElement(event: MouseEvent) {
    let elt = (event.target! as any);
    if ( !(elt instanceof SVGPathElement)) {
      elt = this.flowElements.filter( (element) => element.left <= event.offsetX && element.left + element.width >= event.offsetX && element.top <= event.offsetY && element.top + element.height >= event.offsetY)[0];
    }

    this.selectedElement = elt?.id || null;
    this.requestUpdate("selectedElement");
    event.preventDefault();
  }


  private _computeworkingBoundaries() {
    const elements = this.flowElements;
    const dimensions = {left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0};
    
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

  renderConnector(connectorId: string, color: string, start: {x: number, y: number}, startIsVertical: boolean, end: {x: number, y: number}, endIsVertical: boolean) {


    return svg`
      <path id="${connectorId}" 
            stroke="${this.selectedElement === connectorId ? "var(--highlighted-color)" : color || "black"}" 
            stroke-width="3" 
            fill="transparent"
            @click=${this._selectElement} 
            d="M ${start.x} ${start.y} C ${startIsVertical ? start.x + " " + (start.y + 50): (start.x + 50) + "  " + start.y}, ${end.x - 60} ${end.y} ${end.x-10} ${end.y} "
            marker-end="url(#arrow)" ></path>
    `;
  }

  render() {
    return html`
      <style>
        ::slotted(*)[id="${this.selectedElement}"] {
          stroke: 2px solid var(--highlighted-color);
        }
      </style>
      <div style="height: 100%; position: relative;">
        <div style="position: absolute; pointer-events:none;overflow: scroll; ">
          <div class="toolbar" style="position: sticky; pointer-events: all;">
            <button @click=${() => this.scale = Math.max(this.scale - 0.1, 0.1)}>-</button>
            <button @click=${() => this.scale = 1}> =</button>
            <button @click=${() => this.scale = Math.min(this.scale + 0.1, 2)}>+</button>
            <button @click=${ this._zoomOnFlow }>Zoom</button>
            <input type="range" min="1" max="20" .value="${this.scale * 10}" class="slider" id="myRange" @change=${ (e: Event) => this.scale = (e.target as any).value / 10.0}>
          </div>
        </div>
        <svg tabIndex="0" width="${this.width}" height="${this.height}" style="cursor: crosshair; touch-action: none;" @keyup=${this._onKeyPress} @mousemove=${this._onMouseMove} @mouseup=${this._onMouseUp} @cslick=${this._selectElement} >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
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
                ${this.connectors.map( (connector) => this.renderConnector(connector.id, connector.color, this.resolveOutputPosition(connector), this.resolveConnectorStartShouldBeVertical(connector),  this.resolveInputPosition(connector), this.resolveConnectorEndShouldBeVertical(connector)))}
              </g>
              <g>
                ${this.nodes.filter(n => n.id !== this.draggingId && n.id !== this.selectedElement).map( (node) => node.render())}
                ${this.draggingNode !== undefined ? this.draggingNode.render() : ''}
              </g>
              <g class="selected">
                ${this.selectedElement && this.nodes.findIndex((node) => node.id === this.selectedElement) >= 0 ? this.nodes.find((node) => node.id === this.selectedElement)!.render() : ""};
              </g>
              <g>
                ${ this.isCreatingConnector ? this.renderConnector("tmp", "red", this.creatingConnectorSource!.getGlobalPosition(this.creatingConnectorSourceSlot), this.creatingConnectorSource?.slotConnectorShouldBeVertical(this.creatingConnectorSourceSlot) || false, this.creatingConnectorEndPoint, true ): ''}
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div hidden @render-requested="${() => this.requestUpdate()}">
        <slot @slotchange=${this._handleSlotChange} >
        </slot>
      </div>
    `;
  }
}
  