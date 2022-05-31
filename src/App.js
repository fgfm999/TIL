import React, { useRef } from 'react'
import Head from "./components/Head";
import { Box, Container } from "@mui/material";
import { BrowserRouter, Route, Switch, Routes } from 'react-router-dom';
import Home from './pages/Home';
import User from './pages/User'

export default function App() {
  return (
    <BrowserRouter>
      <Box>
        <Head />
        <Container sx={{ mt: 5 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users/:id" element={<User />} />
          </Routes>
        </Container>
      </Box>
    </BrowserRouter>
  )
}
