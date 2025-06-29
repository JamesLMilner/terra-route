import { h } from "preact";
// import { Route, Router, CustomHistory } from "preact-router";
// import { createHashHistory } from "history";
import Header from "./header/Header";

// Code-splitting is automated for `routes` directory
import Home from "../routes/home";

console.log('App.tsx');

const App = () => (
  <div id="app">
    <Home />
  </div>
);

export default App;
