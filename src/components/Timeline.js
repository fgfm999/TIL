import React, { useState } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Box, Card, CardContent, Typography, Stack, Avatar, CardActions, Chip, IconButton, Link } from "@mui/material"
import LetterAvatar from "./LetterAvatar"
dayjs.extend(relativeTime)

// post: {id, content, user, created_at}
/*
* {
*   content: "hehe"
*   created_at: 1653485695227452700
*   id: 8
*   user: "fgfm999.testnet"
* }
*/
export default function Timeline({ posts }) {


  const follow = async (user) => {
    try {
      await window.contract.follow({ user })
    } catch (e) {
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }

  return (
    <Box>
      {
        posts.map((post) =>
          <Card key={post.id} square>
            <CardContent>
              <Stack direction="row" spacing={2}>
                <Box>
                  <LetterAvatar name={post.user}></LetterAvatar>
                </Box>
                <Box width="100%">
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box>
                      <Typography href={`/users/${post.user}`} variant="subtitle1" component="a" sx={{ textDecoration: "none" }}>{post.user}</Typography>
                      <Typography variant="subtitle2" component="span" marginLeft={2}>{dayjs(Math.trunc(post.created_at / 1000000)).toNow()}</Typography>
                    </Box>
                  </Box>
                  <Typography>{post.content}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )
      }
    </Box>
  )
}