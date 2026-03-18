// Furniture library definitions
// All dimensions in mm
export const FURNITURE_CATEGORIES = [
  {
    id: 'tables',
    name: 'Tables',
    items: [
      { id: 'dining-table', name: 'Dining Table', width: 1500, height: 900, icon: 'table' },
      { id: 'round-table', name: 'Round Table', width: 1000, height: 1000, icon: 'round-table' },
      { id: 'desk', name: 'Desk', width: 1200, height: 600, icon: 'desk' },
      { id: 'side-table', name: 'Side Table', width: 500, height: 500, icon: 'side-table' },
    ],
  },
  {
    id: 'seating',
    name: 'Seating',
    items: [
      { id: 'chair', name: 'Chair', width: 450, height: 450, icon: 'chair' },
      { id: 'sofa-2', name: 'Sofa (2-seat)', width: 1500, height: 800, icon: 'sofa' },
      { id: 'sofa-3', name: 'Sofa (3-seat)', width: 2100, height: 800, icon: 'sofa' },
      { id: 'armchair', name: 'Armchair', width: 800, height: 800, icon: 'armchair' },
    ],
  },
  {
    id: 'counters',
    name: 'Counters',
    items: [
      { id: 'counter', name: 'Counter', width: 600, height: 600, icon: 'counter' },
      { id: 'counter-long', name: 'Long Counter', width: 1800, height: 600, icon: 'counter' },
      { id: 'island', name: 'Kitchen Island', width: 1800, height: 900, icon: 'island' },
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    items: [
      { id: 'fridge', name: 'Fridge', width: 600, height: 700, icon: 'fridge' },
      { id: 'oven-range', name: 'Oven/Range', width: 600, height: 600, icon: 'oven' },
      { id: 'dishwasher', name: 'Dishwasher', width: 600, height: 600, icon: 'dishwasher' },
      { id: 'washing-machine', name: 'Washing Machine', width: 600, height: 600, icon: 'washer' },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    items: [
      { id: 'bathtub', name: 'Bathtub', width: 1700, height: 700, icon: 'bathtub' },
      { id: 'toilet', name: 'Toilet', width: 400, height: 700, icon: 'toilet' },
      { id: 'sink', name: 'Sink/Basin', width: 500, height: 400, icon: 'sink' },
      { id: 'shower', name: 'Shower', width: 900, height: 900, icon: 'shower' },
    ],
  },
  {
    id: 'shelving',
    name: 'Shelving & Storage',
    items: [
      { id: 'shoe-shelf', name: 'Shoe Shelf', width: 800, height: 300, icon: 'shelf' },
      { id: 'bookshelf', name: 'Bookshelf', width: 800, height: 300, icon: 'shelf' },
      { id: 'closet', name: 'Closet', width: 1200, height: 600, icon: 'closet' },
    ],
  },
  {
    id: 'doors',
    name: 'Doors & Windows',
    items: [
      { id: 'door-single', name: 'Door (single)', width: 800, height: 800, icon: 'door' },
      { id: 'door-double', name: 'Door (double)', width: 1600, height: 800, icon: 'door-double' },
      { id: 'sliding-door', name: 'Sliding Door', width: 1800, height: 100, icon: 'sliding-door' },
      { id: 'window', name: 'Window', width: 1000, height: 100, icon: 'window' },
    ],
  },
  {
    id: 'stairs',
    name: 'Stairs',
    items: [
      { id: 'stairs-straight', name: 'Straight Stairs', width: 900, height: 2500, icon: 'stairs' },
    ],
  },
  {
    id: 'beds',
    name: 'Beds',
    items: [
      { id: 'bed-single', name: 'Single Bed', width: 900, height: 2000, icon: 'bed' },
      { id: 'bed-double', name: 'Double Bed', width: 1400, height: 2000, icon: 'bed' },
      { id: 'bed-queen', name: 'Queen Bed', width: 1500, height: 2000, icon: 'bed' },
    ],
  },
];
