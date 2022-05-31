import React, { useState, useRef } from "react"
import { login } from '../utils'
import { TextField, Button, Box, CircularProgress, colors, Typography, Alert } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"
import * as icons from "@mui/icons-material"

export default function PostForm({ onSubmitSuccess }) {
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState("")
    const contentInput = useRef(null)
    const onContentChange = (e) => setContent(e.target.value)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        try {
            await window.contract.create_post({ content })
        } catch (e) {
            alert(
                'Something went wrong! ' +
                'Maybe you need to sign out and back in? ' +
                'Check your browser console for more info.'
            )
            throw e
        }
        contentInput.current.value = ""
        setLoading(false)
        if (onSubmitSuccess) {
            onSubmitSuccess()
        }
    }

    if (!window.walletConnection.isSignedIn()) {
        return <Alert severity="warning" sx={{ marginTop: 2 }} icon={false} action={<Button onClick={login} color="inherit" size="small">Sign in</Button>} >
            Welcome, create a NEAR account, and share what you have learned today.
        </Alert>
    }


    return (
        <Box
            component="form"
            onSubmit={handleSubmit} >
            <TextField multiline minRows={2}
                maxRows={4}
                fullWidth placeholder="What have learned today?"
                onChange={onContentChange}
                inputRef={contentInput}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }} marginTop={2} >
                <LoadingButton variant="contained" size="large" type="submit" loading={loading} loadingPosition="end" endIcon={<icons.Send />} > Send </LoadingButton>
            </Box>
        </Box>
    )
}