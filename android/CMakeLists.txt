cmake_minimum_required(VERSION 3.4.1)
project(OpusTurbo)

set (CMAKE_VERBOSE_MAKEFILE ON)
add_compile_options(
        -fexceptions
        -frtti
        -std=c++17
)

set(OPUS_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../include)
set(OPUS_LIB_DIR ${CMAKE_CURRENT_SOURCE_DIR}/libs)

add_library(opus STATIC IMPORTED)
set_target_properties(opus PROPERTIES IMPORTED_LOCATION
        ${OPUS_LIB_DIR}/libopus-${ANDROID_ABI}.a)

add_library(react-native-opus           STATIC
  ../cpp/NativeOpusTurboModule.cpp
)

target_include_directories(react-native-opus
      PUBLIC
      ../cpp
      ${OPUS_INCLUDE_DIR}
)

target_link_libraries(react-native-opus
  opus
  jsi
  react_nativemodule_core
  react_codegen_RNOpusTurboSpec
)
