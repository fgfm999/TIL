import React from 'react'
import { login, logout } from '../utils'
import { AppBar, Button, Toolbar, Typography } from "@mui/material";


export default function Head() {
    return (<AppBar position="static">
        <Toolbar>
            <Typography variant="h6" sx={{
                mr: 2,
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
            }} component="a" href="/">
                TIL
            </Typography>
            {loginButton()}
        </Toolbar>
    </AppBar>)
}

function loginButton() {
    if (!window.walletConnection.isSignedIn()) {
        return (<Button onClick={login} color="inherit">Sign in</Button>)
    }
    return (<Button onClick={logout} color="inherit">Sign out</Button>)

}
