declare namespace NwJs {

    interface Cookies {
        get(): any;
        getAll(object: any, cb: (cookies: any) => void): void;
    }

    interface WindowConstructor {
        new (): Shell;
        open(url: string, options?: any, callback?: (win: NwJs.Window) => void): void;
        get(): any;
        global: any;
        cookies: Cookies;
    }
    interface Window {
        on(evnt: string, callback?: () => void): void;
        close(force?: boolean): void;
        hide(): void;
        window: any;
        document: any;
        resizeTo(width: number, height: number): void;
        emit(msg: string, data?: any): void;
        global: any;
        showDevTools(id?: string, headless?: boolean): void;
        cookies: Cookies;
    }

    interface ShellConstructor {
        new (): Shell;
        openItem(file_path: string): void;
        openExternal(uri: string): void;
        showItemInFolder(path: string): void;
    }
    interface Shell {

    }

    interface AppConstructor {
        new (): App;
        dataPath: string;

    }
    interface App {

    }

	interface MenuItem {
		//
	}

	interface MenuItemConstructor {
		new (options: any): MenuItem;
	}

	interface Menu {
		append(item: any): void;
		popup(x: number, y: number): void;
	}

	interface MenuConstructor {
		new (): Menu;
	}

	interface NW {
		Menu: MenuConstructor;
		MenuItem: MenuItemConstructor;
		App: AppConstructor;
        Shell: ShellConstructor;
        Window: WindowConstructor;
        require(name: string): any;
        global: any;
	}
}

declare module 'nw.gui' {
	const nw: NwJs.NW;
	export = nw;
}

declare var nw: NwJs.NW;
