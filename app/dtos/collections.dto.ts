export interface MenuItems {
  data: {
    top_menu: TopMenu[];
    vertical_menu: VerticalMenu[];
  };
}

export interface TopMenu {
  id: number;
  tag_name: string;
  display_name: string;
  group: string;
  is_in_top_list: number;
  top_list_position: number;
  is_in_vertical_list: number;
  vertical_list_position?: number;
  is_active: number;
  is_new: number;
}

export interface VerticalMenu {
  id: number;
  tag_name: string;
  display_name: string;
  group: string;
  is_in_top_list: number;
  top_list_position?: number;
  is_in_vertical_list: number;
  vertical_list_position: number;
  is_active: number;
  is_new: number;
}

export interface Category {
  display_name: string;
  tag_name: string;
  group: string;
}

export interface Groups {
  group: string;
}
