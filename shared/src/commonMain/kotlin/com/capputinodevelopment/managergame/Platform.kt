package com.capputinodevelopment.managergame

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform