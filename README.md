# Key Is Link

[![npm version](https://img.shields.io/npm/v/key-is-link)](https://www.npmjs.com/package/key-is-link)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### Type-safe REST API

- Define API URLs as a type object
- Zero runtime overhead — types are stripped at build time
- Automatic URL generation with full type safety
- Compile-time validation for all endpoints

## Installation

```bash
npm install key-is-link
```

## Quick Start

```ts
import { keyIsLink } from "key-is-link";
import axios, { type AxiosRequestConfig } from "axios";

// 1️⃣ Define your API endpoints as a type
type Endpoints = {
  user: {
    (id: number): {
      GET: () => { res: { name: string } };
    };
  };
};

// 2️⃣ Create request function
function requestFn(
  url: string,
  method: string,
  data?: Req,
  config?: AxiosRequestConfig
): Promise {
  return axios
    .request({ url, method, data, ...config })
    .then((r) => r.data);
}

// 3️⃣ Connect them
const api = keyIsLink<Endpoints, AxiosRequestConfig>(requestFn);

// 4️⃣ Use with full type safety & autocomplete
const user = await api.user(1).GET(); // user: { name: string }
```

## example in react-ts project

### make a type object with endpoints

<details>
<summary>pokemon type</summary>

```ts
type Pokemon = {
  name: string;
  url: string;
};
type Sprites = {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
};
type PokemonType = {
  slot: number;
  type: {
    name: string;
    url: string;
  };
};
export type PokemonForm = {
  form_name: string;
  form_names: string[];
  form_order: number;
  id: number;
  is_battle_only: boolean;
  is_default: boolean;
  is_mega: boolean;
  name: string;
  names: string[];
  order: number;
  pokemon: Pokemon;
  sprites: Sprites;
  types: PokemonType[];
  version_group: {
    name: string;
    url: string;
  };
};
```

</details>

```ts
export type MyLink = {
  // lets GET some Pokémons
  api: {
    v2: {
      // "$" means "-"
      pokemon$form: (id: number) => {
        GET: () => { res: PokemonForm };
      };
    };
  };
  // for example
  several_keys: {
    // middle params with other keys
    (): {
      GET: () => { res: Res };
    };
    other_key: {
      POST: (req: Req) => { res: Res };
    };
    another_key: {
      // http methods can together with other keys
      PUT: (req: Req) => { res: Res };
      key_with_method: {
        DELETE: () => { res: Res };
      };
    };
  };
};
```

### make request function

```ts
// this example is using axios library
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from "axios";

const axiosClient: AxiosInstance = axios.create({
  baseURL: "https://pokeapi.co",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

export async function requestFn<Req, Res>(
  url: string,
  method: Method,
  data?: Req,
  config?: AxiosRequestConfig
): Promise<Res> {
  const requestConfig: AxiosRequestConfig = {
    url,
    method,
    data,
    ...config,
  };

  const res: AxiosResponse<Res> = await axiosClient.request<Res>(requestConfig);
  return res.data;
}
```

<img src="./PPAP.jpg" height="50px" title="PPAP" style="margin-bottom: 6px;"/>

```ts
import { keyIsLink } from "key-is-link";
import type { MyLink } from "./typelink";
import type { AxiosRequestConfig } from "axios";
import { requestFn } from "./reqfn";

// you can use custom config option, but using AxiosRequestConfig is convenient mostly
export const myApi = keyIsLink<MyLink, AxiosRequestConfig>(requestFn);
```

### use

```ts
import { useState, type ChangeEvent } from "react";
import "./App.css";
import { myApi } from "./api/api";
import type { PokemonForm } from "./api/typelink";

export function App() {
  const [pokeNum, setPokeNum] = useState(1);
  const [pokemon, setPokemon] = useState<PokemonForm>();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value);
    if (!isNaN(num)) {
      setPokeNum(num);
    }
  };

  const handleClick = async () => {
    try {
      const res = await myApi.api.v2.pokemon$form(pokeNum).GET(); // api call
      setPokemon(res);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="background">
      <img src={pokemon?.sprites.front_default ?? undefined} />
      <input value={pokeNum} onChange={handleChange} />
      <button onClick={handleClick}>req</button>
    </div>
  );
}
```

# Benefits

### Why Key Is Link?

_Single source of truth_ — URLs & types in one place  
_Zero bundle overhead_ — Types disappear at build time  
_Instant refactoring_ — Change the type, update everywhere  
_Compile-time safety_ — Catch URL errors before runtime  
_Framework agnostic_ — Works with axios, fetch, or any HTTP client

## Requirements

- TypeScript >= 4.5

## License

MIT License - see [LICENSE](LICENSE) for details.
