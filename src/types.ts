export type SlideAction = "next" | "prev";

export interface LaserUpdate {
  x: number; // 0 to 1
  y: number; // 0 to 1
  active: boolean;
  presentationId: string;
}

export interface SlideEvent {
  action: SlideAction;
  presentationId: string;
}
