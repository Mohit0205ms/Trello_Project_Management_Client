export interface Card {
  _id: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Backlog' | 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  createdBy: {
    name: string;
    email: string;
  };
}

export interface List {
  _id: string;
  name: string;
  cards: Card[];
  board: string;
}

export interface Board {
  _id: string;
  name: string;
  description: string;
  owner: {
    name: string;
    email: string;
  };
  members: Array<{
    name: string;
    email: string;
  }>;
  lists: List[];
}

export interface CardItemProps {
  card: Card;
  index: number;
  onCardEdited: () => void;
}
