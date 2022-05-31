import React, { useEffect, useState } from "react"
import { Button } from "@mui/material"
import LoadingButton from "@mui/lab/LoadingButton"


export default function FollowButton({ afterAction, user }) {

  const [loading, setLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(async () => {
    const f = await window.contract.is_follow({ user1: window.accountId, user2: user })
    setIsFollowing(f)
  }, [])


  const handleFollow = async () => {
    setLoading(true)
    try {
      await window.contract.follow({ user })
    } catch (e) {
      alert('Something went wrong! ')
      console.log(e)
      throw e
    }
    setLoading(false)
    setIsFollowing(true)
  }

  const handleUnfollow = async () => {
    setLoading(true)
    try {
      await window.contract.unfollow({ user })
    } catch (e) {
      alert('Something went wrong!')
      console.log(e)
      throw e
    }
    setLoading(false)
    setIsFollowing(false)
  }

  if (window.accountId === user) {
    return (<></>)
  }

  if (isFollowing) {
    return (
      <LoadingButton
        variant="contained" onClick={handleUnfollow} loading={loading} >Following</LoadingButton>
    )

  }

  return (
    < LoadingButton variant="contained" onClick={handleFollow} loading={loading} > Follow</LoadingButton >
  )

}