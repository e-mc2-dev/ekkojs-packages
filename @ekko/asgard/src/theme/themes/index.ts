import type { Theme } from '../types';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { draculaTheme } from './dracula';
import { monokaiTheme } from './monokai';
import { nordTheme } from './nord';
import { oneDarkTheme } from './onedark';
import { solarizedDarkTheme } from './solarizedDark';
import { solarizedLightTheme } from './solarizedLight';
import { gruvboxDarkTheme } from './gruvboxDark';
import { gruvboxLightTheme } from './gruvboxLight';
import { tokyoNightTheme } from './tokyoNight';
import { ayuDarkTheme } from './ayuDark';
import { ayuLightTheme } from './ayuLight';
import { materialDarkTheme } from './materialDark';
import { materialLightTheme } from './materialLight';
import { catppuccinMochaTheme } from './catppuccinMocha';
import { catppuccinLatteTheme } from './catppuccinLatte';
import { githubDarkTheme } from './githubDark';
import { githubLightTheme } from './githubLight';
import { palenightTheme } from './palenight';
import { rosePineTheme } from './rosePine';
import { everforestDarkTheme } from './everforestDark';
import { everforestLightTheme } from './everforestLight';
import { arcticTheme } from './arctic';
import { ubuntuTheme } from './ubuntu';
import { linuxMintTheme } from './linuxMint';

export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  dracula: draculaTheme,
  monokai: monokaiTheme,
  nord: nordTheme,
  onedark: oneDarkTheme,
  solarizedDark: solarizedDarkTheme,
  solarizedLight: solarizedLightTheme,
  gruvboxDark: gruvboxDarkTheme,
  gruvboxLight: gruvboxLightTheme,
  tokyoNight: tokyoNightTheme,
  ayuDark: ayuDarkTheme,
  ayuLight: ayuLightTheme,
  materialDark: materialDarkTheme,
  materialLight: materialLightTheme,
  catppuccinMocha: catppuccinMochaTheme,
  catppuccinLatte: catppuccinLatteTheme,
  githubDark: githubDarkTheme,
  githubLight: githubLightTheme,
  palenight: palenightTheme,
  rosePine: rosePineTheme,
  everforestDark: everforestDarkTheme,
  everforestLight: everforestLightTheme,
  arctic: arcticTheme,
  ubuntu: ubuntuTheme,
  linuxMint: linuxMintTheme,
};

export const themeNames = Object.keys(themes);

export {
  darkTheme,
  lightTheme,
  draculaTheme,
  monokaiTheme,
  nordTheme,
  oneDarkTheme,
  solarizedDarkTheme,
  solarizedLightTheme,
  gruvboxDarkTheme,
  gruvboxLightTheme,
  tokyoNightTheme,
  ayuDarkTheme,
  ayuLightTheme,
  materialDarkTheme,
  materialLightTheme,
  catppuccinMochaTheme,
  catppuccinLatteTheme,
  githubDarkTheme,
  githubLightTheme,
  palenightTheme,
  rosePineTheme,
  everforestDarkTheme,
  everforestLightTheme,
  arcticTheme,
  ubuntuTheme,
  linuxMintTheme,
};
