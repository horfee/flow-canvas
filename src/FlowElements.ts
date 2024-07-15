import { LitElement, svg, PropertyValueMap } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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
  icon: string | undefined = undefined;

  get nbSlots() {
    return 2;
  }

  // @property({type: Number, reflect: true})
  // nbSlots = 2;

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

  protected _onMouseDownOnNode(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent("mouse-down", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this
    }}));

  }

  protected _onMouseUp(e: MouseEvent) {
    this.dispatchEvent(new CustomEvent("mouse-up", { bubbles: true, detail: {
      x: e.clientX,
      y: e.clientY,
      node: this
    }}));

  }

  protected _onMouseDownOnPort(slotNumber: number, e: MouseEvent) {
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

  protected _onMouseUpOnPort(slotNumber: number, e: MouseEvent) {
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

  static get color(): String {
    return "#c0edc0";
  }

  slotConnectorShouldBeVertical(input: number) {
    return false;
  }

  render() {
    const mustAlignIconLeft = this.iconAnchor === "left";
    const lines = this.label.split("\n");
    return svg`
    <g class="node" id="${this.id}" transform="translate(${this.left || 0},${this.top || 0})" @mousedown=${this._onMouseDownOnNode.bind(this)} @mouseup=${this._onMouseUp.bind(this)} >
      <rect class="node-rect " rx="5" ry="5" fill="${(this.constructor as any).color}" width="${this.width}" height="${this.height}"></rect>
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

  isInputSlot(input: number): boolean {
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
  
}

@customElement("flow-condition-element")
export class FlowConditionElement extends FlowElement {


  static get color() {
    return "yellow";
  }
  
  get nbSlots() {
    return 3;
  }

  constructor() {
    super();
    //this.color = "yellow";
    // this.nbSlots = 3;
    this.addEventListener("connector-created", (event: Event) => {
      const connector : FlowConnector = (event as CustomEvent).detail as FlowConnector;
      if (connector.predecessor === this.id && connector.predecessorSlot === 1 ) {
        connector.color = "green";
      } else if (connector.predecessor === this.id && connector.predecessorSlot === 2 ) {
        connector.color = "#990000";
      }
    });
  }

  slotConnectorShouldBeVertical(input: number) {
    return input === 2;
  }

  getPositionForSlot(input: number): { x: number; y: number; } {
    return input == 0 ? { x: 0, y : this.height / 2}:
      input == 1 ? { x: this.width, y : this.height / 2}:
      input == 2 ? { x: this.width / 2, y : this.height} : 
      {x: NaN, y: NaN};    
  }

   

  render(){
    const mustAlignIconLeft = this.iconAnchor === "left";
    const lines = this.label.split("\n");
    return svg`
    <g class="node" id="${this.id}" transform="translate(${this.left || 0},${this.top || 0})" @mousedown=${this._onMouseDownOnNode.bind(this)} @mouseup=${this._onMouseUp.bind(this)} >
      <polygon class="node-rect " fill="${FlowConditionElement.color}" points="0, ${this.height / 2} ${this.width / 2}, 0 ${this.width}, ${this.height / 2} ${this.width / 2}, ${this.height}" />
      <g class="node-icon" x="0" y="0" transform="translate(16,-16)" style="pointer-events: none;">
        <image xlink:href="${this.icon}" class="node-icon" x="0" width="30" height="30" y="0" style=""></image>
      </g>
      <g class="node-label" transform="translate(${ mustAlignIconLeft ? 38 : 8 },${(this.height - (lines.length * 24)) / 2 + 15})">
        ${lines.map( (label, index) => svg`
          <text class="node-label-text" x="0" y="${index * 24}">${label}</text>
        `)}
        
      </g>
      <g>
          <text x="${this.width - 4}" y="${this.height / 2 - 16}">+</text>
          <text x="${this.width / 2 - 16}" y="${this.height}">-</text>
      </g>
      ${map(range(this.nbSlots), (i) => {
        const pos = this.getPositionForSlot(i);
      
        return svg`
        <g class="port" transform="translate(${pos.x - 5},${pos.y -5})" @mousedown=${this._onMouseDownOnPort.bind(this, i)} @mouseup=${this._onMouseUpOnPort.bind(this, i)} >
          <rect rx="3" ry="3" width="10" height="10" class="flow-port"></rect>
        </g>
        `
      })}
    </g>`;
  }

}

@customElement("flow-comment-element")
export class FlowCommentElement extends FlowElement {
  
  get nbSlots(): number {
      return 0;
  }
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

@customElement("flow-for-loop-element")
export class FlowForLoopElement extends FlowElement {
  
  static get color() {
    return "lightblue";
  }


  get nbSlots(): number {
      return 4;
  }

  constructor() {
    super();
    // this.nbSlots = 4;
  }


  isInputSlot(input: number): boolean {
      return input === 0 || input === 3;
  }

  getPositionForSlot(input: number): { x: number; y: number; } {
      return input === 0 ? { x: 0, y: this.height / 2}:
        input === 1 ? { x: this.width, y: this.height / 2}:
        input === 2 ? { x: this.width / 2, y: this.height}:
        input === 3 ? { x: this.width - 15, y: this.height}:
        {x: NaN, y: NaN};
  }

  slotConnectorShouldBeVertical(input: number): boolean {
      return input >= 2 ;
  }
}