import { TezosToolkit } from "@dune-network/taquito";
import React from "react";

export const TezosContext = React.createContext(new TezosToolkit());
