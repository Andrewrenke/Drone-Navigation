export interface RouteEvent {
  route: {
    legs: {
      steps: {
        intersections: {
          location: number[];
        }[];
      }[];
    }[];
  }[];
}
