import React from "react"
import { Box, Typography, Paper, Stack } from "@mui/material"
import { useParams } from "react-router-dom"
import LetterAvatar from "../components/LetterAvatar"
import FollowButton from "../components/FollowButton"


export default function User() {
  const { id: userId } = useParams()
  const isMe = window.accountId === userId

  return (
    <Box>
      <Paper sx={{ padding: 2 }}>
        <Stack direction="row" spacing={2} >
          <LetterAvatar name={userId} size={60} />
          <Typography variant="h4">{userId}</Typography>
          <FollowButton user={userId} />
        </Stack>
      </Paper>

    </Box>
  )
}