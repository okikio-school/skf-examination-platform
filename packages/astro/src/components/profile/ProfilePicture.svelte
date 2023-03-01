<script lang="ts">
  import { onMount } from "svelte";
  import { getUserProfile } from "../../db/profile/getProfile";
  import { updateProfile } from "../../db/profile/updateProfile";
  import {
    getProfilePicture,
    uploadProfilePicture,
  } from "../../db/storage/storageProfile";
  import Pencil from "../svgs/Pencil.svelte";
  import UserIcon from "../svgs/User.svelte";

  import type { User as UserT } from "@supabase/supabase-js";

  export let user: UserT;

  let input: HTMLInputElement;
  let files: FileList | null = null;
  let userProfilePicture = "";
  const userId = user.id;

  function inputHandler() {
    input.click();
  }

  onMount(async () => {
    const data = await getUserProfile(userId);
    if (!data) return;
    if (!data.profile_picture) return;
    userProfilePicture = getProfilePicture(data.profile_picture);
  });

  $: if (files) {
    (async () => {
      const path = await uploadProfilePicture(files[0], userId);
      if (!path) return;
      await updateProfile(userId, path);
      userProfilePicture = getProfilePicture(path);
    })();
  }
</script>

<div class="avatar">
  {#if userProfilePicture}
    <img src={userProfilePicture} alt="avatar" />
  {:else}
    <UserIcon />
  {/if}
  <input type="file" hidden bind:this={input} bind:files />
  <div
    class="avatar-icon-pencil"
    on:click={inputHandler}
    on:keypress={(e) => e.key === "Enter" && inputHandler()}
  >
    <Pencil />
  </div>
</div>

<style>
  .avatar {
    width: 120px;
    height: 120px;
    display: flex;
    position: relative;
  }

  .avatar-icon-pencil {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: var(--primary-400);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    width: 28px;
    height: 28px;
  }

  .avatar :global(.icon-pencil) {
    width: 16px;
    height: 16px;
    color: var(--text-primary);
  }

  img {
    border-radius: 50%;
  }
</style>
