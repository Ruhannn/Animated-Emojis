#!/bin/bash

for f in ./emoji-with-code/*.tgs; do
    lottie_to_webp.sh --output "${f%.tgs}.webp" "$f"
    rm "$f"
done
